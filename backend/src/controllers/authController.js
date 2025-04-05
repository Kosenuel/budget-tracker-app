const User = require('../models/User');
const { comparePassword, generateToken } = require('../utils/authUtils');

const register = async (req, res) => {
    const { name, email, password, preferred_currency } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    try {
        const existingUser = await User.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const newUser = await User.createUser({ name, email, password, preferred_currency });
        // Exclude password hash from the response
        const { password_hash, ...userWithoutPassword } = newUser;

        const token = generateToken(newUser.id, newUser.email);

        res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

         // Exclude password hash from the user object sent back
         const { password_hash, ...userWithoutPassword } = user;

        const token = generateToken(user.id, user.email);

        res.status(200).json({ user: userWithoutPassword, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

 // Example protected route controller function
 const getProfile = async (req, res) => {
    // req.user is attached by the authMiddleware
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
     try {
         // Fetch fresh user data if needed, otherwise use req.user
         // For simplicity here, we'll just return the user info from the token payload
         // but ideally fetch from DB to get latest preferred_currency etc.
         const user = await User.findUserById(req.user.id);
         if (!user) {
             return res.status(404).json({ message: 'User not found' });
         }
         res.status(200).json({ user });
     } catch (error) {
         console.error('Get Profile error:', error);
         res.status(500).json({ message: 'Error fetching profile', error: error.message });
     }
 };


module.exports = {
    register,
    login,
    getProfile
};