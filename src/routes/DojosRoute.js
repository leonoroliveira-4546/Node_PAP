const express = require("express");
const app = express();
app.use(express.json()); 

const DojoController = require("../controllers/DojoController");
const verifyToken = require("../middlewares/is_auth");

app.get("/get_dojos",DojoController.getDojos);
app.post("/create_dojo", DojoController.createDojo);
app.post("/join_dojo", DojoController.joinDojo);

app.post("/dojos/:dojoId/schedule", verifyToken, DojoController.addTrainingSchedule);
app.get("/dojo/members/:dojoId", verifyToken, DojoController.getDojoMembers);
app.post("/dojo/remove-member", verifyToken, DojoController.removeMember);

app.post("/dojos/:dojoId/tournaments", verifyToken, DojoController.createTournament);
app.get("/dojos/:dojoId/tournaments", verifyToken, DojoController.getDojoTournaments);

module.exports = app;