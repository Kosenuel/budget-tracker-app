const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

const protect = (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            // Get token from header
            token = authHeader.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user id and email to the request object (can fetch full user later if needed)
            req.user= { id: decoded.id, email: decoded.email};
            // Store basic info
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({message: 'Not authorized, no token'}); // No token provided
    }
};

module.exports = { protect };
// This middleware will be used in routes to protect them