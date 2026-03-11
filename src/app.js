const express = require('express');
const cors = require('cors'); // CORS for cross-origin requests
const morgan = require('morgan'); // HTTP request logger
const helmet = require('helmet'); // Security middleware to set HTTP headers
const bodyParser = require('body-parser'); // To parse request bodies
const path = require('path');
const errorHandler = require('./middlewares/errorMiddleware'); // Custom error handling middlewares
const fileRoutes = require("./routes/fileRoutes");
const userRoutes = require('./routes/userRoutes'); // Import user routes
const AdminRoutes = require('./routes/admin'); // Import admin routes
const FavoritesRoutes = require('./routes/favoriteRoutes'); // Import Favorite Product Routes
const UserEnquiryRoutes = require('./routes/userEnquiryRoutes'); // Import Favorite Product Routes
const internalUserRoutes = require('./routes/internalUserRoutes');
const cookieParser = require('cookie-parser');

const app = express();

// CORS Configuration - Only allow specific origins
const allowedOrigins = [];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      // Origin is allowed
      callback(null, true);
    } else {
      // Origin is not allowed
      callback(new Error('Not allowed by CORS - Invalid origin'));
    }
  },
  credentials: true, // Allow cookies to be sent with requests
  optionsSuccessStatus: 200, // For legacy browser support
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};

// Middleware setup
app.use(cookieParser());
app.use(morgan('dev')); // Log requests in 'dev' format
app.use(helmet()); // Secure app by setting HTTP headers
// app.use(cors(corsOptions)); // Apply CORS with allowed origins only
app.use(bodyParser.json()); // Parse incoming JSON request bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded data
app.use('/uploads', express.static(path.join(__dirname, "..", 'uploads')));

// Define routes
app.get("/", (req, res)=>{
    return res.send("Node Backend is Running...");
})
app.use('/api/file', fileRoutes); // files routes (bulk upload, etc.)
app.use('/api/user', userRoutes); // User routes (user profile, etc.)
app.use('/api/user/favoriteproduct', FavoritesRoutes); // User routes (user profile, etc.)
app.use('/api/user/enquiry', UserEnquiryRoutes); // User routes (user profile, etc.)
app.use('/api/admin', AdminRoutes); // Admin routes (admin management, etc.)
app.use('/api/internal', internalUserRoutes);

// Catch 404 errors
// app.use(notFoundHandler);

// Global error handler (Custom Error Handling)
app.use(errorHandler);

module.exports = app;