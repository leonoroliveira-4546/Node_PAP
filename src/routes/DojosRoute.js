const express = require("express")
const app = express()
app.use(express.json())

const DojoController = require("../controllers/DojoController")
const verifyToken = require("../middlewares/is_auth")

app.get("/get_dojos",DojoController.getDojos)
app.post("/create_dojo", DojoController.createDojo)
app.post("/join_dojo", DojoController.joinDojo)

app.post("/dojos/:dojoId/schedule", verifyToken, DojoController.addTrainingSchedule)
app.put("/dojos/:dojoId/schedule", verifyToken, DojoController.updateTrainingSchedules)
app.get("/dojo/members/:dojoId", verifyToken, DojoController.getDojoMembers)
app.post("/dojo/remove-member", verifyToken, DojoController.removeMember)
app.post("/dojo/remove-child", verifyToken, DojoController.removeChildFromResponsible)
app.get("/dojo/athletes-without-dojo", verifyToken, DojoController.getAthletesWithoutDojo)

app.post("/dojos/:dojoId/tournaments", verifyToken, DojoController.createTournament)
app.get("/dojos/:dojoId/tournaments", verifyToken, DojoController.getDojoTournaments)
app.put("/dojos/tournaments/:tournamentId", verifyToken, DojoController.updateTournament)
app.delete("/dojos/tournaments/:tournamentId", verifyToken, DojoController.deleteTournament)
app.post("/dojos/migrate-tournaments", verifyToken, DojoController.migrateTournamentsToDojo)

app.post("/dojos/:dojoId/invite", verifyToken, DojoController.inviteMember)
app.post("/dojos/:dojoId/request", verifyToken, DojoController.submitJoinRequest)
app.post("/dojos/:dojoId/requests/:userId/accept", verifyToken, DojoController.acceptJoinRequest)
app.post("/dojos/:dojoId/requests/:userId/reject", verifyToken, DojoController.rejectJoinRequest)

module.exports = app