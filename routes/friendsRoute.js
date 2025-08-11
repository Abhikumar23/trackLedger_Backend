const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { getFriends, addFriend, removeFriend, clearAllFriends } = require('../controllers/friendsController');

router.use(requireAuth);

router.get('/', getFriends);
router.post('/', addFriend);
router.delete('/:friendName', removeFriend);
router.delete('/', clearAllFriends);

module.exports = router;
