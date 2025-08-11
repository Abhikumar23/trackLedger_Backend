const Transaction = require('../model/transaction');
const TransactionLog = require('../model/transactionLog');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SEC;

// 🔐 Get logged-in user ID from cookie token
function getUserIdFromToken(req) {
  const { token } = req.cookies;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded.id;
  } catch (err) {
    return null;
  }
}

// CREATE
exports.createTransactionLog = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, date, description, price, category, expanse } = req.body;

    const data = await Transaction.create({
      name,
      date,
      description,
      price,
      category,
      user: userId,
    });

    await TransactionLog.create({
      action: 'CREATED',
      transactionId: data._id,
      user: userId,
      expanse: expanse,
      changes: {
        name: data.name,
        price: data.price,
        date: data.date,
        description: data.description,
        category: data.category,
      },
    });

    res.status(201).json({ message: 'Transaction created', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Transaction creation failed' });
  }
};

// UPDATE
exports.updateTransactionLog = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const original = await Transaction.findOne({ _id: id, user: userId });
    if (!original) return res.status(404).json({ message: 'Not found or unauthorized' });

    const { name, date, description, price, category } = req.body;

    const updated = await Transaction.findByIdAndUpdate(
      id,
      { name, date, description, price, category },
      { new: true }
    );

    await TransactionLog.create({
      action: 'UPDATED',
      transactionId: id,
      user: userId,
      changes: {
        before: {
          category: original.category,
          name: original.name,
          price: original.price,
          date: original.date,
          description: original.description,
        },
        after: {
          category: updated.category,
          name: updated.name,
          price: updated.price,
          date: updated.date,
          description: updated.description,
        },
      },
    });

    res.json({ message: 'Transaction updated', data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
};

// DELETE
exports.deleteTransactionLog = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const toDelete = await Transaction.findOne({ _id: id, user: userId });
    if (!toDelete) return res.status(404).json({ message: 'Not found or unauthorized' });

    const deleted = await Transaction.findByIdAndDelete(id);

    await TransactionLog.create({
      action: 'DELETED',
      transactionId: id,
      user: userId,
      changes: {
        name: toDelete.name,
        price: toDelete.price,
        date: toDelete.date,
        description: toDelete.description,
        category: toDelete.category,
      },
    });

    res.json({ message: 'Transaction deleted', deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed' });
  }
};

// GET logs for a single transaction
exports.getTransactionLog = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const logs = await TransactionLog.find({
      transactionId: req.params.id,
      user: userId
    }).sort({ timestamp: -1 });

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
};

// GET all logs for the user
exports.getAllTransactionLogs = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const logs = await TransactionLog.find({ user: userId })
      .sort({ timestamp: -1 })
      .populate('transactionId');
      

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch all logs' });
  }
};
