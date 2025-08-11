const Expense = require('../model/expense');
const User = require('../model/User');




exports.getExpense = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};


exports.createExpense = async (req, res) => {
  const { category, amount, itemName, friends, amountPerPerson, date } = req.body;

  try {
    const expense = await Expense.create({
      user: req.user._id,
      category,
      amount,
      itemName,
      friends,
      amountPerPerson,
      date
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create expense' });
  }
};


exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted', expense });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

exports.updateExpense = async (req, res) => {
  const { category, amount, itemName, friends, amountPerPerson, date } = req.body;

  try {
    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, // Match expense belonging to user
      {
        category,
        amount,
        itemName,
        friends,
        amountPerPerson,
        date,
      },
      { new: true } // Return the updated document
    );

    if (!updatedExpense) {
      return res.status(404).json({ error: 'Expense not found or unauthorized' });
    }

    res.json(updatedExpense);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update expense' });
  }
};



