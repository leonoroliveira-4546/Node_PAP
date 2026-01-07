const express = require("express");
const app = express();
app.use(express.json()); 

const AuthController = require("../controllers/AuthController");

app.post("/register",AuthController.register);
app.post("/login", AuthController.login);
app.post("/logout", AuthController.logout);

module.exports = app;