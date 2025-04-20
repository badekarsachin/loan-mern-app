const Loan = require("../models/Loan");
const User = require("../models/User");
// const uuid = require("uuid"); // Optional: uncomment if you're using custom UUIDs

// Create Loan - For Authenticated Users
exports.createLoan = async (req, res) => {

  console.log("📥 Incoming loan request:", req.body);

  try {
    const userId = req.params.userId;
    const { loanAmount, term, panNumber } = req.body;

    if (!loanAmount || !term || !panNumber || loanAmount <= 0 || term <= 0) {
      return res.status(400).json({ error: "Invalid loan data" });
    }

    const weeklyRepaymentAmount = loanAmount / term;
    const scheduledRepayments = [];

    let currentDate = new Date();

    for (let i = 0; i < term; i++) {
      scheduledRepayments.push({
        date: new Date(currentDate),
        amount: weeklyRepaymentAmount,
        status: "PENDING",
      });
      currentDate.setDate(currentDate.getDate() + 7);
    }

    const loan = new Loan({
      amount: loanAmount,
      term,
      user: userId,
      panNumber, // Make sure Loan schema supports this
      scheduledRepayments,
      status: "PENDING",
    });

    await loan.save();

    res.status(201).json({ message: "Loan created successfully", loanId: loan._id });
  } catch (error) {
    console.error("Error creating loan:", error);
    res.status(500).json({ error: "Failed to create loan" });
  }
};


// Get All Loans - For Admin Only
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find().populate("user", "fullName");

    const loansWithFullName = loans.map((loan) => ({
      _id: loan._id,
      amount: loan.amount,
      term: loan.term,
      status: loan.status,
      fullName: loan.user.fullName,
    }));

    res.status(200).json(loansWithFullName);
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
};

// Update Loan Status - For Admin Only
exports.updateLoanStatus = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { newStatus } = req.body;

    if (!["PENDING", "APPROVED", "PAID", "REJECTED"].includes(newStatus)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const loan = await Loan.findById(loanId);

    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    loan.status = newStatus;
    await loan.save();

    res.status(200).json({ message: "Loan status updated successfully" });
  } catch (error) {
    console.error("Error updating loan status:", error);
    res.status(500).json({ error: "Failed to update loan status" });
  }
};

// Get User's Loans - For Authenticated Users
exports.getUserLoans = async (req, res) => {
  try {
    const userId = req.params.userId;

    const loans = await Loan.find({ user: userId });

    const userLoans = loans.map((loan) => {
      const amountLeft = loan.scheduledRepayments.reduce((total, repayment) => {
        return total + repayment.amount;
      }, 0);

      return {
        loanId: loan._id,
        amount: loan.amount,
        status: loan.status,
        amountLeft,
      };
    });

    res.status(200).json(userLoans);
  } catch (error) {
    console.error("Error fetching user loans:", error);
    res.status(500).json({ error: "Failed to fetch user loans" });
  }
};

// Get Loan Details with User Name
exports.getLoanDetails = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findById(loanId);

    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    const user = await User.findById(loan.user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const loanWithUserName = {
      ...loan.toObject(),
      userName: user.fullName,
    };

    res.status(200).json(loanWithUserName);
  } catch (error) {
    console.error("Error fetching loan details:", error);
    res.status(500).json({ error: "Failed to fetch loan details" });
  }
};

// Process Repayment for a Loan
exports.processRepayment = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { amountPaid } = req.body;

    const loan = await Loan.findById(loanId);

    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    if (loan.status === "PAID") {
      return res.status(400).json({ error: "Loan already marked as PAID" });
    }

    let totalAmountPaid = amountPaid;

    for (const repayment of loan.scheduledRepayments) {
      if (
        repayment.status === "PENDING" ||
        repayment.status === "PARTIALLY PAID"
      ) {
        if (totalAmountPaid >= repayment.amount) {
          totalAmountPaid -= repayment.amount;
          repayment.amount = 0;
          repayment.status = "PAID";
        } else if (totalAmountPaid === 0) break;
        else {
          repayment.amount -= totalAmountPaid;
          repayment.status = "PARTIALLY PAID";
          break;
        }
      }
    }

    const allRepaymentsPaid = loan.scheduledRepayments.every(
      (repayment) => repayment.status === "PAID"
    );

    if (allRepaymentsPaid) {
      loan.status = "PAID";
    }

    await loan.save();

    res.status(200).json({ message: "Repayments processed successfully" });
  } catch (error) {
    console.error("Error processing repayments:", error);
    res.status(500).json({ error: "Failed to process repayments" });
  }
};
