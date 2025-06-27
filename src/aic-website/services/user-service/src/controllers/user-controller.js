const { StatusCodes } = require('http-status-codes');
const User = require('../models/user');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { publishUserEvent } = require('../events/user-events');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  const { role, status, sort, search, page, limit } = req.query;
  
  // Build query
  const queryObject = {};
  
  // Filter by role
  if (role) {
    queryObject.role = role;
  }
  
  // Filter by status
  if (status) {
    queryObject.status = status;
  }
  
  // Search by name or email
  if (search) {
    queryObject.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
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
  const users = await User.find(queryObject)
    .sort(sortOptions)
    .skip(skip)
    .limit(pageSize);
  
  // Get total count
  const totalUsers = await User.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalUsers / pageSize);
  
  res.status(StatusCodes.OK).json({
    users,
    count: users.length,
    totalUsers,
    numOfPages,
    currentPage: pageNumber,
  });
};

// Get single user
const getUser = async (req, res) => {
  const { id: userId } = req.params;
  
  // Check if user is requesting their own data or is an admin
  if (req.user.userId !== userId && req.user.role !== 'admin') {
    throw new ForbiddenError('Not authorized to access this resource');
  }
  
  const user = await User.findOne({ _id: userId });
  
  if (!user) {
    throw new NotFoundError(`No user with id: ${userId}`);
  }
  
  res.status(StatusCodes.OK).json({ user });
};

// Update user
const updateUser = async (req, res) => {
  const { id: userId } = req.params;
  const { firstName, lastName, preferences } = req.body;
  
  // Check if user is updating their own data or is an admin
  if (req.user.userId !== userId && req.user.role !== 'admin') {
    throw new ForbiddenError('Not authorized to update this resource');
  }
  
  if (!firstName && !lastName && !preferences) {
    throw new BadRequestError('Please provide values to update');
  }
  
  const user = await User.findOne({ _id: userId });
  
  if (!user) {
    throw new NotFoundError(`No user with id: ${userId}`);
  }
  
  // Update fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (preferences) {
    if (preferences.theme) user.preferences.theme = preferences.theme;
    if (preferences.notifications) {
      if (preferences.notifications.email !== undefined) {
        user.preferences.notifications.email = preferences.notifications.email;
      }
      if (preferences.notifications.marketing !== undefined) {
        user.preferences.notifications.marketing = preferences.notifications.marketing;
      }
    }
  }
  
  await user.save();
  
  // Publish user updated event
  await publishUserEvent('user.updated', {
    userId: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    preferences: user.preferences,
  });
  
  res.status(StatusCodes.OK).json({ user });
};

// Update user role (admin only)
const updateUserRole = async (req, res) => {
  const { id: userId } = req.params;
  const { role } = req.body;
  
  if (!role) {
    throw new BadRequestError('Please provide role');
  }
  
  const user = await User.findOne({ _id: userId });
  
  if (!user) {
    throw new NotFoundError(`No user with id: ${userId}`);
  }
  
  user.role = role;
  await user.save();
  
  // Publish user role updated event
  await publishUserEvent('user.role-updated', {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });
  
  res.status(StatusCodes.OK).json({ user });
};

// Update user status (admin only)
const updateUserStatus = async (req, res) => {
  const { id: userId } = req.params;
  const { status } = req.body;
  
  if (!status) {
    throw new BadRequestError('Please provide status');
  }
  
  const user = await User.findOne({ _id: userId });
  
  if (!user) {
    throw new NotFoundError(`No user with id: ${userId}`);
  }
  
  user.status = status;
  await user.save();
  
  // Publish user status updated event
  await publishUserEvent('user.status-updated', {
    userId: user._id.toString(),
    email: user.email,
    status: user.status,
  });
  
  res.status(StatusCodes.OK).json({ user });
};

// Delete user
const deleteUser = async (req, res) => {
  const { id: userId } = req.params;
  
  // Check if user is deleting their own account or is an admin
  if (req.user.userId !== userId && req.user.role !== 'admin') {
    throw new ForbiddenError('Not authorized to delete this resource');
  }
  
  const user = await User.findOne({ _id: userId });
  
  if (!user) {
    throw new NotFoundError(`No user with id: ${userId}`);
  }
  
  // Store user info for event before deletion
  const userInfo = {
    userId: user._id.toString(),
    email: user.email,
  };
  
  await user.deleteOne();
  
  // Publish user deleted event
  await publishUserEvent('user.deleted', userInfo);
  
  res.status(StatusCodes.OK).json({ msg: 'User deleted successfully' });
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  const user = await User.findOne({ _id: req.user.userId });
  
  if (!user) {
    throw new NotFoundError(`No user with id: ${req.user.userId}`);
  }
  
  res.status(StatusCodes.OK).json({ user });
};

// Update current user password
const updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    throw new BadRequestError('Please provide both old and new password');
  }
  
  const user = await User.findOne({ _id: req.user.userId }).select('+password');
  
  if (!user) {
    throw new NotFoundError(`No user with id: ${req.user.userId}`);
  }
  
  const isPasswordCorrect = await user.comparePassword(oldPassword);
  
  if (!isPasswordCorrect) {
    throw new BadRequestError('Invalid old password');
  }
  
  user.password = newPassword;
  await user.save();
  
  // Publish password changed event
  await publishUserEvent('user.password-changed', {
    userId: user._id.toString(),
    email: user.email,
  });
  
  res.status(StatusCodes.OK).json({ msg: 'Password updated successfully' });
};

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getCurrentUser,
  updatePassword,
};
