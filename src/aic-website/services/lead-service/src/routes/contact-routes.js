const express = require('express');
const router = express.Router();

const {
  submitContactForm,
  getAllContactForms,
  getContactForm,
  updateContactFormStatus,
  convertToLead,
  markAsSpam,
  getContactStats,
} = require('../controllers/contact-controller');

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// Public route for submitting contact forms
router.post('/', submitContactForm);

// Routes that require authentication
router.use(authenticateUser);

// Stats route - restricted to admin and managers
router.route('/stats').get(
  authorizePermissions('admin', 'manager'),
  getContactStats
);

// Routes for managing contact forms - restricted to admin, manager, and sales roles
router.route('/')
  .get(
    authorizePermissions('admin', 'manager', 'sales'),
    getAllContactForms
  );

router.route('/:id')
  .get(
    authorizePermissions('admin', 'manager', 'sales'),
    getContactForm
  );

router.route('/:id/status')
  .patch(
    authorizePermissions('admin', 'manager', 'sales'),
    updateContactFormStatus
  );

router.route('/:id/convert')
  .post(
    authorizePermissions('admin', 'manager', 'sales'),
    convertToLead
  );

router.route('/:id/spam')
  .post(
    authorizePermissions('admin', 'manager', 'sales'),
    markAsSpam
  );

module.exports = router;
