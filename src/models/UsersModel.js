const mongoose = require("mongoose")

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
    profilePic: {
      type: String,
      default: null
    },
    belt: {
      type: String,
      default: 'Branca'
    },
    points: {
      type: Number,
      default: 0
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
      enum: ["athlete", "responsavel", "sensei", "admin", "praticinador"],
      required: true
    },
    birthDate: {
      type: Date,
      required: function () {
        return this.type === "athlete"
      }
    },
    responsavelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null
    },
    childrens: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      username: { type: String, required: true },
      birthDate: { type: Date },
      absences: [{
        month: { type: String, default: '' },
        count: { type: Number, default: 0 },
        reason: { type: String, enum: ["disease", "other"], default: "other" }
      }]
    }],
    dojoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dojos",
      default: null
    },
    absences: [{
      month: { type: String, default: '' },
      count: { type: Number, default: 0 },
      reason: { type: String, enum: ["disease", "other"], default: "other" }
    }],
    status: {
      type: String,
      enum: ["pending", "active", "blocked"],
      default: "pending"
    }
})

const Users = mongoose.model("users", UsersSchema)
module.exports = Users