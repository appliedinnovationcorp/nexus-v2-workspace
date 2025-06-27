const { StatusCodes } = require('http-status-codes');
const crypto = require('crypto');
const User = require('../models/user');
const { BadRequestError, UnauthenticatedError, NotFoundError } = require('../utils/errors');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../services/email-service');
const { publishUserEvent } = require('../events/user-events');

// Register a new user
const register = async (req, res) => {
  const { email, firstName, lastName, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new BadRequestError('Email already exists');
  }

  // Create verification token
  const verificationToken = crypto.randomBytes(40).toString('hex');

  // Create user
  const user = await User.create({
    email,
    firstName,
    lastName,
    password,
    verificationToken,
  });

  // Send verification email
  await sendVerificationEmail({
    name: user.firstName,
    email: user.email,
    verificationToken,
    origin: req.get('origin'),
  });

  // Publish user created event
  await publishUserEvent('user.created', {
    userId: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
  });

  res.status(StatusCodes.CREATED).json({
    msg: 'Success! Please check your email to verify account',
  });
};

// Verify email
const verifyEmail = async (req, res) => {
  const { token, email } = req.body;
  
  const user = await User.findOne({ email });
  
  if (!user) {
    throw new UnauthenticatedError('Verification failed');
  }

  if (user.verificationToken !== token) {
    throw new UnauthenticatedError('Verification failed');
  }

  user.isVerified = true;
  user.verified = Date.now();
  user.verificationToken = '';
  user.status = 'active';

  await user.save();

  // Publish user verified event
  await publishUserEvent('user.verified', {
    userId: user._id.toString(),
    email: user.email,
  });

  res.status(StatusCodes.OK).json({ msg: 'Email verified' });
};

// Login user
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new UnauthenticatedError('Invalid credentials');
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid credentials');
  }

  if (!user.isVerified) {
    throw new UnauthenticatedError('Please verify your email');
  }

  if (user.status !== 'active') {
    throw new UnauthenticatedError('Account is not active');
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  const token = user.createJWT();

  // Publish user login event
  await publishUserEvent('user.login', {
    userId: user._id.toString(),
    email: user.email,
  });

  res.status(StatusCodes.OK).json({
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    token,
  });
};

// Forgot password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    throw new BadRequestError('Please provide email');
  }

  const user = await User.findOne({ email });

  if (user) {
    const passwordToken = crypto.randomBytes(70).toString('hex');
    
    // Send email
    await sendResetPasswordEmail({
      name: user.firstName,
      email: user.email,
      token: passwordToken,
      origin: req.get('origin'),
    });

    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    user.passwordToken = crypto
      .createHash('md5')
      .update(passwordToken)
      .digest('hex');
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;
    
    await user.save();
  }

  res.status(StatusCodes.OK).json({
    msg: 'Please check your email for reset password link',
  });
};

// Reset password
const resetPassword = async (req, res) => {
  const { token, email, password } = req.body;
  
  if (!token || !email || !password) {
    throw new BadRequestError('Please provide all values');
  }

  const user = await User.findOne({ email });
  
  if (!user) {
    throw new UnauthenticatedError('Invalid credentials');
  }

  const currentDate = new Date();
  
  if (
    user.passwordToken === crypto.createHash('md5').update(token).digest('hex') &&
    user.passwordTokenExpirationDate > currentDate
  ) {
    user.password = password;
    user.passwordToken = null;
    user.passwordTokenExpirationDate = null;
    await user.save();
  } else {
    throw new UnauthenticatedError('Invalid or expired token');
  }

  // Publish password reset event
  await publishUserEvent('user.password-reset', {
    userId: user._id.toString(),
    email: user.email,
  });

  res.status(StatusCodes.OK).json({ msg: 'Password reset successful' });
};

// Logout user
const logout = async (req, res) => {
  // In a token-based auth system, the client is responsible for removing the token
  // This endpoint is mainly for logging purposes or future extensions
  
  if (req.user) {
    // Publish user logout event
    await publishUserEvent('user.logout', {
      userId: req.user.userId,
      email: req.user.email,
    });
  }
  
  res.status(StatusCodes.OK).json({ msg: 'User logged out!' });
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
};
