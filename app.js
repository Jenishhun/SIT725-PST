const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const expressLayouts = require('express-ejs-layouts');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const incomeRoutes = require('./routes/income.routes');
const expenseRoutes = require('./routes/expense.routes');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb+srv://jigishpatel30:BrArWEstq6FaE9j6@cluster0.6jxvjzr.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));

// Set up EJS and layouts
app.set('view engine', 'ejs');
app.set('layout', 'layout');
app.use(expressLayouts);

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // in case JSON APIs

// Session setup with Mongo store
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb+srv://jigishpatel30:BrArWEstq6FaE9j6@cluster0.6jxvjzr.mongodb.net/' })
}));


// Middleware to set user globally for all views
app.use(async (req, res, next) => {
  if (req.session.userId) {
    const User = require('./models/user.model');
    try {
      const user = await User.findById(req.session.userId);
      res.locals.user = user || null;
    } catch (err) {
      console.log(err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});

// Mount routes
app.use('/', authRoutes);    // Auth routes: /login, /register, forgot-password, reset-password
app.use('/', userRoutes);    // User settings/profile routes
app.use('/', incomeRoutes);  // Income-related routes
app.use('/', expenseRoutes); // Expense-related routes
app.use('/', require('./routes/goal.routes')); // Goal-related routes
app.use('/', require('./routes/report.routes')); // Analytics-related routes
app.use('/', require('./routes/dashboard.routes')); // Notification-related routes


// Home route
app.get('/home', async (req, res) => {
  if (req.session.userId) {
    const User = require('./models/user.model');
    try {
      const user = await User.findById(req.session.userId);
      res.render('home', { title: 'Home - Personal Budget Tracker', user });
    } catch (err) {
      console.log(err);
      res.redirect('/login');
    }
  } else {
    res.redirect('/login');
  }
});

// 404 error handling
// app.use((req, res, next) => {
//   res.status(404).render('404', { title: '404 - Page Not Found' });
// });
// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).render('500', { title: '500 - Internal Server Error' });
// });

// Root redirect
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/home');
  } else {
    res.redirect('/login');
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

module.exports = app;
