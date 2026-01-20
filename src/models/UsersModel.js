const mongoose = require("mongoose");

const UsersSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: false
    },
    profilePic: {
      type: String,
      default: null
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ["athlete", "responsavel", "sensei", "admin"],
      required: true
    },
    password: {
      type: String,
      required: true
    },
    birthDate: {
      type: Date,
      required: function () {
        return this.role === "athlete";
      }
    },
    responsavelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null
    },
    dojoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dojos",
      default: null
    },
    status: {
      type: String,
      enum: ["pending", "active", "blocked"],
      default: "pending"
    }
});

const Users = mongoose.model("users", UsersSchema);
module.exports = Users;