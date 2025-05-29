const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { isAuth } = require('../middleware/auth');

const router = express.Router();

// Register Route
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register - Personal Budget Tracker', error: null });
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('register', {
        title: 'Register - Personal Budget Tracker',
        error: 'Email is already registered.',
      });
    }

    const newUser = new User({ username, password });
    await newUser.save();
    res.redirect('/login');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', {
      title: 'Register - Personal Budget Tracker',
      error: 'An unexpected error occurred. Please try again.',
    });
  }
});

// Login Route
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login - Personal Budget Tracker', error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('login', {
        title: 'Login - Personal Budget Tracker',
        error: 'Email not found. Please register.',
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', {
        title: 'Login - Personal Budget Tracker',
        error: 'Incorrect password. Please try again.',
      });
    }

    req.session.userId = user._id;
    res.redirect('/home');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', {
      title: 'Login - Personal Budget Tracker',
      error: 'An unexpected error occurred. Please try again.',
    });
  }
});

// Forgot Password
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { title: 'Forgot Password - Personal Budget Tracker', error: null });
});

router.post('/forgot-password', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('forgot-password', {
        title: 'Forgot Password - Personal Budget Tracker',
        error: 'Email not found. Please enter a valid email.',
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    req.session.otp = otp;
    req.session.resetUserId = user._id;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'jenishhun7@gmail.com',
        pass: 'rllr vesp fcmc vubu',
      },
    });

    const mailOptions = {
      from: 'jenishhun7@gmail.com',
      to: user.username,
      subject: 'Password Reset OTP',
      text: `Your OTP for resetting your password is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    res.redirect('/verify-otp');
  } catch (error) {
    console.error('Forgot-password error:', error);
    res.render('forgot-password', {
      title: 'Forgot Password - Personal Budget Tracker',
      error: 'Failed to send OTP. Please try again later.',
    });
  }
});

// Verify OTP
router.get('/verify-otp', (req, res) => {
  res.render('verify-otp', { title: 'Verify OTP - Personal Budget Tracker', error: null });
});

router.post('/verify-otp', async (req, res) => {
  const { otp, newPassword } = req.body;
  try {
    if (otp !== req.session.otp) {
      return res.render('verify-otp', {
        title: 'Verify OTP - Personal Budget Tracker',
        error: 'Incorrect OTP. Please try again.',
      });
    }

    // Use resetUserId for password reset flow instead of userId
    const userId = req.session.resetUserId;
    if (!userId) {
      // No reset session info — ask user to restart forgot password
      return res.redirect('/forgot-password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    // Clean up the reset session keys
    delete req.session.otp;
    delete req.session.resetUserId;

    res.redirect('/login');
  } catch (error) {
    console.error('OTP verification error:', error);
    res.render('verify-otp', {
      title: 'Verify OTP - Personal Budget Tracker',
      error: 'An unexpected error occurred. Please try again.',
    });
  }
});


// Reset Password (logged-in user)
router.get('/reset-password', isAuth, (req, res) => {
  res.render('reset-password', { title: 'Reset Password', error: null });
});

router.post('/reset-password', isAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect('/login');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.render('reset-password', {
        title: 'Reset Password',
        error: 'Old password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    res.redirect('/settings?success=Password reset successfully');
  } catch (error) {
    console.error('Password reset error:', error);
    res.render('reset-password', {
      title: 'Reset Password',
      error: 'Failed to reset password. Please try again.',
    });
  }
});

// Logout Route
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
