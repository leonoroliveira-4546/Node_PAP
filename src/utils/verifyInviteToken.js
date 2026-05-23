const jwt = require("jsonwebtoken")

const INVITE_SECRET = process.env.INVITE_SECRET || "invite_secret_123"

module.exports = (token) => {
  return jwt.verify(token, INVITE_SECRET)
}