const mongoose = require("mongoose");

const DojosSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true
    },
    city: {
      type: String,
      required: true
    },
    profilePic: {
      type: String,
      default: null
    },
    trainingSchedule: [{
      day: { type: String, required: true },
      time: { type: String, required: true },
      location: { type: String, required: true }
    }],
    sensei: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'users',
      required: true
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }]
});

const Dojos = mongoose.model("dojos", DojosSchema);
module.exports = Dojos;