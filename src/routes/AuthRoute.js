const express = require("express");
const app = express();
app.use(express.json()); 

const AuthController = require("../controllers/AuthController");
const verifyToken = require("../middlewares/is_auth");

app.post("/register",AuthController.register);
app.post("/login", AuthController.login);
app.post("/logout", AuthController.logout);

app.post('/invite-responsavel', AuthController.inviteResponsavel);
app.post('/confirm-responsavel', AuthController.confirmResponsavelInvite);

app.post("/calculate_age", AuthController.calculateAge);

app.post("/addPerformance", verifyToken, AuthController.addPerformance);
app.get("/getAthletePerformance", verifyToken, AuthController.getAthletePerformance);
app.post("/addAbsence", verifyToken, AuthController.addAbsence);
app.get("/getAthleteAbsences/:userId", verifyToken, AuthController.getAbsencesByMonth);

module.exports = app;