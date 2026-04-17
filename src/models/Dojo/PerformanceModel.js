const mongoose = require("mongoose");

const PerformanceModel = new mongoose.Schema({
  athlete: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  feedback: {
    improvements: [{ type: String }],
    needsImprovement: [{ type: String }]
  },
  month: {
    type: String, // YYYY-MM
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Performance = mongoose.model("performances", PerformanceModel);
module.exports = Performance;