const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const loanSchema = new Schema({
  amount: {
    type: Number,
    required: true,
  },
  term: {
    type: Number,
    required: true,
  },
  panNumber: {
    type: String,
    required: true, // or false if optional
    // match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    // PAN number format validation
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  scheduledRepayments: [
    {
      date: {
        type: Date,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: ["PENDING", "PAID", "PARTIALLY PAID"],
        default: "PENDING",
      },
    },
  ],
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "PAID", "REJECTED"],
    default: "PENDING",
  },
});


const Loan = mongoose.model("Loan", loanSchema);

module.exports = Loan;
