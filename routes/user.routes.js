const express = require('express');
const User = require('../models/user.model');
const { isAuth } = require('../middleware/auth');
const router = express.Router();

// Show Profile Settings page
router.get('/settings', isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).lean();
    if (!user) return res.redirect('/login');
    res.render('settings', { title: 'Profile Settings', user });
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }
});

// Handle Profile Update
router.post('/settings', isAuth, async (req, res) => {
  const { firstName, lastName, currency } = req.body;
  try {
    await User.findByIdAndUpdate(req.session.userId, { firstName, lastName, currency });
    res.redirect('/settings?success=Profile updated successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/settings?error=Failed to update profile');
  }
});

module.exports = router;
