const { StatusCodes } = require('http-status-codes');
const ContactForm = require('../models/contact-form');
const Lead = require('../models/lead');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { publishContactEvent } = require('../events/contact-events');
const { publishLeadEvent } = require('../events/lead-events');
const { sendNotificationEmail } = require('../services/email-service');

// Submit a contact form
const submitContactForm = async (req, res) => {
  // Extract client info from request
  const clientInfo = {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    referrer: req.headers.referer || req.headers.referrer,
  };
  
  // Create contact form submission with client info
  const contactForm = await ContactForm.create({
    ...req.body,
    ...clientInfo,
  });
  
  // Publish contact form submitted event
  await publishContactEvent('contact.submitted', {
    contactId: contactForm._id.toString(),
    email: contactForm.email,
    firstName: contactForm.firstName,
    lastName: contactForm.lastName,
    subject: contactForm.subject,
    service: contactForm.service,
  });
  
  // Send notification email to admin
  await sendNotificationEmail({
    subject: `New Contact Form Submission: ${contactForm.subject}`,
    name: `${contactForm.firstName} ${contactForm.lastName}`,
    email: contactForm.email,
    message: contactForm.message,
    service: contactForm.service,
  });
  
  res.status(StatusCodes.CREATED).json({
    msg: 'Contact form submitted successfully',
    contactId: contactForm._id,
  });
};

// Get all contact form submissions with filtering, sorting, and pagination
const getAllContactForms = async (req, res) => {
  const { 
    status, 
    service, 
    search, 
    sort, 
    page, 
    limit,
    startDate,
    endDate,
  } = req.query;
  
  // Build query
  const queryObject = {};
  
  // Filter by status
  if (status) {
    queryObject.status = status;
  }
  
  // Filter by service
  if (service) {
    queryObject.service = service;
  }
  
  // Filter by date range
  if (startDate || endDate) {
    queryObject.createdAt = {};
    if (startDate) queryObject.createdAt.$gte = new Date(startDate);
    if (endDate) queryObject.createdAt.$lte = new Date(endDate);
  }
  
  // Search by name, email, subject, message
  if (search) {
    queryObject.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
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
  const contactForms = await ContactForm.find(queryObject)
    .sort(sortOptions)
    .skip(skip)
    .limit(pageSize);
  
  // Get total count
  const totalContactForms = await ContactForm.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalContactForms / pageSize);
  
  res.status(StatusCodes.OK).json({
    contactForms,
    count: contactForms.length,
    totalContactForms,
    numOfPages,
    currentPage: pageNumber,
  });
};

// Get a single contact form submission
const getContactForm = async (req, res) => {
  const { id: contactId } = req.params;
  
  const contactForm = await ContactForm.findOne({ _id: contactId });
  
  if (!contactForm) {
    throw new NotFoundError(`No contact form with id: ${contactId}`);
  }
  
  res.status(StatusCodes.OK).json({ contactForm });
};

// Update contact form status
const updateContactFormStatus = async (req, res) => {
  const { id: contactId } = req.params;
  const { status } = req.body;
  
  if (!status) {
    throw new BadRequestError('Please provide status');
  }
  
  const contactForm = await ContactForm.findOneAndUpdate(
    { _id: contactId },
    { status },
    { new: true, runValidators: true }
  );
  
  if (!contactForm) {
    throw new NotFoundError(`No contact form with id: ${contactId}`);
  }
  
  // Publish contact status updated event
  await publishContactEvent('contact.status-updated', {
    contactId: contactForm._id.toString(),
    email: contactForm.email,
    status: contactForm.status,
  });
  
  res.status(StatusCodes.OK).json({ contactForm });
};

// Convert contact form to lead
const convertToLead = async (req, res) => {
  const { id: contactId } = req.params;
  const { assignedTo, notes } = req.body;
  
  const contactForm = await ContactForm.findOne({ _id: contactId });
  
  if (!contactForm) {
    throw new NotFoundError(`No contact form with id: ${contactId}`);
  }
  
  if (contactForm.status === 'converted') {
    throw new BadRequestError('Contact form is already converted to lead');
  }
  
  // Check if lead with this email already exists
  let lead = await Lead.findOne({ email: contactForm.email });
  
  if (lead) {
    // Update existing lead with new information
    lead.source = 'website';
    lead.sourceDetails = 'contact form';
    
    // Add interaction for this contact form
    lead.interactions.push({
      type: 'website',
      details: `Contact form submission: ${contactForm.subject}`,
      date: contactForm.createdAt,
      outcome: 'positive',
    });
    
    // Update last contact date
    lead.lastContactDate = new Date();
    
    // Add notes if provided
    if (notes) {
      lead.notes = lead.notes ? `${lead.notes}\n\n${notes}` : notes;
    }
    
    // Add service as interest if provided
    if (contactForm.service && !lead.interests.includes(contactForm.service)) {
      lead.interests.push(contactForm.service);
    }
    
    // Update assigned to if provided
    if (assignedTo) {
      lead.assignedTo = assignedTo;
    }
    
    await lead.save();
    
    // Update contact form status
    contactForm.status = 'converted';
    contactForm.leadId = lead._id;
    await contactForm.save();
    
    // Publish events
    await publishContactEvent('contact.converted', {
      contactId: contactForm._id.toString(),
      leadId: lead._id.toString(),
      email: contactForm.email,
    });
    
    await publishLeadEvent('lead.updated-from-contact', {
      leadId: lead._id.toString(),
      email: lead.email,
      contactId: contactForm._id.toString(),
    });
    
    res.status(StatusCodes.OK).json({
      msg: 'Contact form linked to existing lead',
      lead,
      contactForm,
    });
  } else {
    // Create new lead from contact form
    lead = await Lead.create({
      firstName: contactForm.firstName,
      lastName: contactForm.lastName,
      email: contactForm.email,
      phone: contactForm.phone,
      company: contactForm.company,
      source: 'website',
      sourceDetails: 'contact form',
      status: 'new',
      notes: notes || `Contact form submission: ${contactForm.subject}\n\n${contactForm.message}`,
      assignedTo: assignedTo || undefined,
      lastContactDate: new Date(),
      interests: contactForm.service ? [contactForm.service] : [],
      interactions: [
        {
          type: 'website',
          details: `Contact form submission: ${contactForm.subject}`,
          date: contactForm.createdAt,
          outcome: 'positive',
        },
      ],
      metadata: {
        budget: contactForm.budget,
        timeframe: contactForm.timeframe,
      },
    });
    
    // Update contact form status
    contactForm.status = 'converted';
    contactForm.leadId = lead._id;
    await contactForm.save();
    
    // Publish events
    await publishContactEvent('contact.converted', {
      contactId: contactForm._id.toString(),
      leadId: lead._id.toString(),
      email: contactForm.email,
    });
    
    await publishLeadEvent('lead.created-from-contact', {
      leadId: lead._id.toString(),
      email: lead.email,
      contactId: contactForm._id.toString(),
    });
    
    res.status(StatusCodes.CREATED).json({
      msg: 'Contact form converted to new lead',
      lead,
      contactForm,
    });
  }
};

// Mark contact form as spam
const markAsSpam = async (req, res) => {
  const { id: contactId } = req.params;
  
  const contactForm = await ContactForm.findOneAndUpdate(
    { _id: contactId },
    { status: 'spam' },
    { new: true }
  );
  
  if (!contactForm) {
    throw new NotFoundError(`No contact form with id: ${contactId}`);
  }
  
  // Publish contact marked as spam event
  await publishContactEvent('contact.marked-as-spam', {
    contactId: contactForm._id.toString(),
    email: contactForm.email,
  });
  
  res.status(StatusCodes.OK).json({
    msg: 'Contact form marked as spam',
    contactForm,
  });
};

// Get contact form statistics
const getContactStats = async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }
  
  // Get total contact forms count
  const totalContactForms = await ContactForm.countDocuments(dateFilter);
  
  // Get contact forms by status
  const contactsByStatus = await ContactForm.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  
  // Get contact forms by service
  const contactsByService = await ContactForm.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$service', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  
  // Get conversion rate
  const convertedContacts = await ContactForm.countDocuments({
    ...dateFilter,
    status: 'converted',
  });
  
  const conversionRate = totalContactForms > 0 ? (convertedContacts / totalContactForms) * 100 : 0;
  
  res.status(StatusCodes.OK).json({
    totalContactForms,
    convertedContacts,
    conversionRate: parseFloat(conversionRate.toFixed(2)),
    contactsByStatus,
    contactsByService,
  });
};

module.exports = {
  submitContactForm,
  getAllContactForms,
  getContactForm,
  updateContactFormStatus,
  convertToLead,
  markAsSpam,
  getContactStats,
};
