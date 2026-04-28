const mongoose = require("mongoose");

const UsersSchema = new mongoose.Schema({
    authUid: {
      type: String,
      required: true,
      unique: true
    },
    username: {
      type: String,
      required: true,
      unique: false
    },
    name: {
      type: String,
      default: null
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
    birthDate: {
      type: Date,
      required: function () {
        return this.type === "athlete";
      }
    },
    responsavelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null
    },
    childrens: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      username: { type: String, required: true},
      birthDate: { type: Date, required: true},
      absences: [{
        month: { type: String, required: true },
        count: { type: Number, required: true },
        reason: { type: String, enum: ["disease", "other"], default: "other" }
      }]
    }],
    dojoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dojos",
      default: null
    },
    absences: [{
      month: { type: String, required: true },
      count: { type: Number, required: true },
      reason: { type: String, enum: ["disease", "other"], default: "other" }
    }],
    belt: {
      type: String,
      enum: ["Branca", "Amarela", "Laranja", "Verde", "Azul", "Vermelha", "Marrom", "Preta"],
      default: "Branca"
    },
    points: {
      type: Number,
      default: 0
    },
    ranking: {
      type: Number,
      default: null
    },
    currentPlan: {
      type: String,
      enum: ["free", "economico", "premium"],
      default: "free"
    },
    status: {
      type: String,
      enum: ["pending", "active", "blocked"],
      default: "pending"
    }
});

const Users = mongoose.model("users", UsersSchema);
module.exports = Users;