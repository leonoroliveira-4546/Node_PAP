const jwt = require("jsonwebtoken")

const INVITE_SECRET = process.env.INVITE_SECRET || "invite_secret_123"

module.exports = (payload) => {
  return jwt.sign(payload, INVITE_SECRET, {
    expiresIn: "48h"
  })
}