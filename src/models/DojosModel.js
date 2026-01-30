const mongoose = require("mongoose");

const DojosSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: false
    },
    profilePic: {
      type: String,
      default: null
    },
    members: [{id: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }}]
});

const Dojos = mongoose.model("dojos", DojosSchema);
module.exports = Dojos;