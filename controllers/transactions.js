const Transaction = require('../model/transaction');
const mongoose = require('mongoose');

const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SEC;

// 🔐 Helper to extract user ID from token
function getUserIdFromToken(req, res) {
  const { token } = req.cookies;
  if (!token) return null;

  try {
    const userData = jwt.verify(token, jwtSecret);
    return userData.id;
  } catch (err) {
    return null;
  }
}

exports.createTransaction = async (req, res) => {
  const userId = getUserIdFromToken(req, res);        
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { name, date, description, price, category } = req.body;

  try {
    const data = await Transaction.create({
      name,
      date,
      description,
      price,
      category,
      user: userId, // ✅ Link to logged-in user
    });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Create failed' });
  }
};

exports.getTransaction = async (req, res) => {
  const userId = getUserIdFromToken(req, res);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const data = await Transaction.find({ user: userId }).sort({ date: -1 });
  res.status(200).json({
    message: `Your transactions`,
    data: data,
  });
};

exports.deleteTransaction = async (req, res) => {
  const userId = getUserIdFromToken(req, res);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: userId, // ✅ Only allow deleting if user owns it
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true, deleted: transaction });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
};

exports.putTransaction = async (req, res) => {
  const userId = getUserIdFromToken(req, res);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { name, date, description, price, category } = req.body;

  const updatedTransaction = await Transaction.findOneAndUpdate(
    { _id: id, user: userId }, // ✅ Match user
    { name, date, description, price, category},
    { new: true }
  );

  if (!updatedTransaction) {
    return res.status(404).json({ message: 'Transaction not found or not yours' });
  }

  res.json({ message: 'Transaction updated successfully', data: updatedTransaction });
};

exports.monthlySummery = async (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json({ error: "Not logged in" });

  try {
    const userData = jwt.verify(token, jwtSecret);  // fixes here

    const summary = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userData.id) } },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            category: "$category",
            name: "$name",
          },
          total: { $sum: "$price" },
        },
      },
      {
        $project: {
          month: '$_id.month',
          category: '$_id.category',
          name: '$_id.name',
          total: 1,
          _id: 0,
        },
      },
      { $sort: { month: 1, category: 1 } },
    ]);

    res.json(summary);
  } catch (err) {
    console.error("Monthly summary error:", err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


exports.findTransaction = async (req, res) => {
  const userId = getUserIdFromToken(req, res);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const transaction = await Transaction.findOne({ _id: id, user: userId });

  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found or not yours' });
  }

  res.json({ data: transaction });
};
