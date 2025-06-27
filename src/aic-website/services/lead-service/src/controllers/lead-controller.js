const { StatusCodes } = require('http-status-codes');
const Lead = require('../models/lead');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { publishLeadEvent } = require('../events/lead-events');

// Create a new lead
const createLead = async (req, res) => {
  const lead = await Lead.create(req.body);
  
  // Publish lead created event
  await publishLeadEvent('lead.created', {
    leadId: lead._id.toString(),
    email: lead.email,
    firstName: lead.firstName,
    lastName: lead.lastName,
    source: lead.source,
    status: lead.status,
  });
  
  res.status(StatusCodes.CREATED).json({ lead });
};

// Get all leads with filtering, sorting, and pagination
const getAllLeads = async (req, res) => {
  const { 
    status, 
    source, 
    assignedTo, 
    minScore, 
    maxScore, 
    search, 
    sort, 
    page, 
    limit,
    convertedToCustomer,
    interests,
    startDate,
    endDate,
  } = req.query;
  
  // Build query
  const queryObject = {};
  
  // Filter by status
  if (status) {
    queryObject.status = status;
  }
  
  // Filter by source
  if (source) {
    queryObject.source = source;
  }
  
  // Filter by assignedTo
  if (assignedTo) {
    queryObject.assignedTo = assignedTo;
  }
  
  // Filter by score range
  if (minScore || maxScore) {
    queryObject.score = {};
    if (minScore) queryObject.score.$gte = Number(minScore);
    if (maxScore) queryObject.score.$lte = Number(maxScore);
  }
  
  // Filter by convertedToCustomer
  if (convertedToCustomer !== undefined) {
    queryObject.convertedToCustomer = convertedToCustomer === 'true';
  }
  
  // Filter by interests
  if (interests) {
    const interestArray = interests.split(',');
    queryObject.interests = { $in: interestArray };
  }
  
  // Filter by date range
  if (startDate || endDate) {
    queryObject.createdAt = {};
    if (startDate) queryObject.createdAt.$gte = new Date(startDate);
    if (endDate) queryObject.createdAt.$lte = new Date(endDate);
  }
  
  // Search by name, email, company
  if (search) {
    queryObject.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }
  
  // Pagination
  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 10;
  const skip = (pageNumber - 1) * pageSize;
  
  // Sorting
  let sortOptions = { createdAt: -1 };
  if (sort) {
    const sortFields = sort.split(',').join(' ');
    sortOptions = sortFields;
  }
  
  // Execute query
  const leads = await Lead.find(queryObject)
    .sort(sortOptions)
    .skip(skip)
    .limit(pageSize)
    .populate('assignedTo', 'firstName lastName email');
  
  // Get total count
  const totalLeads = await Lead.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalLeads / pageSize);
  
  res.status(StatusCodes.OK).json({
    leads,
    count: leads.length,
    totalLeads,
    numOfPages,
    currentPage: pageNumber,
  });
};

// Get a single lead
const getLead = async (req, res) => {
  const { id: leadId } = req.params;
  
  const lead = await Lead.findOne({ _id: leadId })
    .populate('assignedTo', 'firstName lastName email');
  
  if (!lead) {
    throw new NotFoundError(`No lead with id: ${leadId}`);
  }
  
  res.status(StatusCodes.OK).json({ lead });
};

// Update a lead
const updateLead = async (req, res) => {
  const { id: leadId } = req.params;
  const updateData = req.body;
  
  // Prevent updating certain fields directly
  delete updateData.score; // Score is calculated automatically
  
  const lead = await Lead.findOneAndUpdate(
    { _id: leadId },
    updateData,
    { new: true, runValidators: true }
  ).populate('assignedTo', 'firstName lastName email');
  
  if (!lead) {
    throw new NotFoundError(`No lead with id: ${leadId}`);
  }
  
  // Publish lead updated event
  await publishLeadEvent('lead.updated', {
    leadId: lead._id.toString(),
    email: lead.email,
    status: lead.status,
    assignedTo: lead.assignedTo?._id?.toString(),
  });
  
  res.status(StatusCodes.OK).json({ lead });
};

// Delete a lead
const deleteLead = async (req, res) => {
  const { id: leadId } = req.params;
  
  const lead = await Lead.findOne({ _id: leadId });
  
  if (!lead) {
    throw new NotFoundError(`No lead with id: ${leadId}`);
  }
  
  // Store lead info for event before deletion
  const leadInfo = {
    leadId: lead._id.toString(),
    email: lead.email,
  };
  
  await lead.deleteOne();
  
  // Publish lead deleted event
  await publishLeadEvent('lead.deleted', leadInfo);
  
  res.status(StatusCodes.OK).json({ msg: 'Lead deleted successfully' });
};

// Add an interaction to a lead
const addInteraction = async (req, res) => {
  const { id: leadId } = req.params;
  const { type, details, outcome } = req.body;
  
  if (!type || !details) {
    throw new BadRequestError('Please provide type and details for the interaction');
  }
  
  const lead = await Lead.findOne({ _id: leadId });
  
  if (!lead) {
    throw new NotFoundError(`No lead with id: ${leadId}`);
  }
  
  // Add new interaction
  const interaction = {
    type,
    details,
    outcome: outcome || 'unknown',
    date: new Date(),
  };
  
  lead.interactions.push(interaction);
  lead.lastContactDate = new Date();
  
  await lead.save();
  
  // Publish lead interaction event
  await publishLeadEvent('lead.interaction-added', {
    leadId: lead._id.toString(),
    email: lead.email,
    interaction: {
      type,
      date: interaction.date,
      outcome: interaction.outcome,
    },
  });
  
  res.status(StatusCodes.OK).json({ lead });
};

// Convert lead to customer
const convertToCustomer = async (req, res) => {
  const { id: leadId } = req.params;
  
  const lead = await Lead.findOne({ _id: leadId });
  
  if (!lead) {
    throw new NotFoundError(`No lead with id: ${leadId}`);
  }
  
  if (lead.convertedToCustomer) {
    throw new BadRequestError('Lead is already converted to customer');
  }
  
  lead.convertedToCustomer = true;
  lead.convertedDate = new Date();
  lead.status = 'won';
  
  await lead.save();
  
  // Publish lead converted event
  await publishLeadEvent('lead.converted', {
    leadId: lead._id.toString(),
    email: lead.email,
    firstName: lead.firstName,
    lastName: lead.lastName,
    company: lead.company,
    convertedDate: lead.convertedDate,
  });
  
  res.status(StatusCodes.OK).json({ lead });
};

// Get lead statistics
const getLeadStats = async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }
  
  // Get total leads count
  const totalLeads = await Lead.countDocuments(dateFilter);
  
  // Get leads by status
  const leadsByStatus = await Lead.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  
  // Get leads by source
  const leadsBySource = await Lead.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  
  // Get conversion rate
  const convertedLeads = await Lead.countDocuments({
    ...dateFilter,
    convertedToCustomer: true,
  });
  
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  
  // Get average score
  const scoreResult = await Lead.aggregate([
    { $match: dateFilter },
    { $group: { _id: null, averageScore: { $avg: '$score' } } },
  ]);
  
  const averageScore = scoreResult.length > 0 ? scoreResult[0].averageScore : 0;
  
  res.status(StatusCodes.OK).json({
    totalLeads,
    convertedLeads,
    conversionRate: parseFloat(conversionRate.toFixed(2)),
    averageScore: parseFloat(averageScore.toFixed(2)),
    leadsByStatus,
    leadsBySource,
  });
};

module.exports = {
  createLead,
  getAllLeads,
  getLead,
  updateLead,
  deleteLead,
  addInteraction,
  convertToCustomer,
  getLeadStats,
};
