const mongoose = require("mongoose")

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
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    // Convites enviados pelo sensei (email + quem convidou)
    invites: [{
      email: { type: String },
      invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
      status: { type: String, default: 'pending' },
      date: { type: Date, default: Date.now }
    }],
    // Pedidos de entrada enviados por usuários
    joinRequests: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
      date: { type: Date, default: Date.now }
    }]
})

const Dojos = mongoose.model("dojos", DojosSchema)
module.exports = Dojos