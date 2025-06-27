const express = require('express');
const router = express.Router();

const {
  createLead,
  getAllLeads,
  getLead,
  updateLead,
  deleteLead,
  addInteraction,
  convertToCustomer,
  getLeadStats,
} = require('../controllers/lead-controller');

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// Routes that require authentication
router.use(authenticateUser);

// Stats route - restricted to admin and managers
router.route('/stats').get(
  authorizePermissions('admin', 'manager'),
  getLeadStats
);

// Main routes
router.route('/')
  .post(createLead)
  .get(getAllLeads);

router.route('/:id')
  .get(getLead)
  .patch(updateLead)
  .delete(authorizePermissions('admin', 'manager'), deleteLead);

// Special actions
router.route('/:id/interactions')
  .post(addInteraction);

router.route('/:id/convert')
  .post(convertToCustomer);

module.exports = router;
