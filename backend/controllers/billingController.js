const User = require('../models/User');

// @desc    Get current user's token balance
// @route   GET /api/billing/tokens
// @access  Private
const getTokenBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('tokens');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: { tokens: user.tokens } });
    } catch (error) {
        console.error('Error fetching token balance:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Add tokens to user's account (dummy endpoint)
// @route   POST /api/billing/add-tokens
// @access  Private
const addTokens = async (req, res) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Please provide a valid amount' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.tokens += amount;
        await user.save();

        res.json({ success: true, data: { newBalance: user.tokens } });
    } catch (error) {
        console.error('Error adding tokens:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getTokenBalance, addTokens };
