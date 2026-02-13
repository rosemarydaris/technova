// middleware/adminMiddleware.js

const adminMiddleware = (req, res, next) => {
  // Check if user is admin using isAdmin field
  if (!req.user.isAdmin) {
    return res.status(403).json({ 
      message: "Access denied. Admin privileges required." 
    });
  }
  
  next();
};

module.exports = adminMiddleware;