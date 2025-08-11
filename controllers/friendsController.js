const Expense = require('../model/expense');
const User = require('../model/User');


exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('friends');
    res.json({ friends: user.friends || [] });
  } catch (err) {
    console.error('Get friends error:', err);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
};


// POST /api/friends - Add a friend to user's list
exports.addFriend = async (req, res) => {
  const { friendName } = req.body;

  if (!friendName || !friendName.trim()) {
    return res.status(400).json({ error: 'Friend name is required' });
  }

  try {
    const user = await User.findById(req.user._id);
    
    if (!user.friends) {
      user.friends = [];
    }

    // Check if friend already exists
    if (user.friends.includes(friendName.trim())) {
      return res.status(400).json({ error: 'Friend already exists' });
    }

    user.friends.push(friendName.trim());
    await user.save();

    res.status(201).json({ 
      message: 'Friend added successfully', 
      friends: user.friends 
    });
  } catch (err) {
    console.error('Add friend error:', err);
    res.status(500).json({ error: 'Failed to add friend' });
  }
};

// DELETE /api/friends/:friendName - Remove a specific friend
exports.removeFriend = async (req, res) => {
  const { friendName } = req.params;

  try {
    const user = await User.findById(req.user._id);
    
    if (!user.friends || !user.friends.includes(friendName)) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    user.friends = user.friends.filter(friend => friend !== friendName);
    await user.save();

    res.json({ 
      message: 'Friend removed successfully', 
      friends: user.friends 
    });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
};

// DELETE /api/friends - Clear all friends for user
exports.clearAllFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.friends = [];
    await user.save();

    res.json({ 
      message: 'All friends cleared successfully', 
      friends: [] 
    });
  } catch (err) {
    console.error('Clear friends error:', err);
    res.status(500).json({ error: 'Failed to clear friends' });
  }
};