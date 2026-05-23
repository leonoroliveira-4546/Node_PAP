const express = require('express')
const app = express()

const EducationalController = require('../controllers/EducationalController')
const EducationalChallengeController = require('../controllers/EducationalChallengeController')
const verifyToken = require('../middlewares/is_auth')
const verifyAdmin = require('../middlewares/is_admin')

app.get('/educational', verifyToken, EducationalController.getContent)
app.post('/educational', verifyToken, verifyAdmin, EducationalController.createContent)
app.put('/educational/:id', verifyToken, verifyAdmin, EducationalController.updateContent)
app.delete('/educational/:id', verifyToken, verifyAdmin, EducationalController.deleteContent)
app.post('/educational/:id/submit', verifyToken, EducationalController.submitGameResponse)

// Challenges for dojos
app.post('/educational/challenges', verifyToken, EducationalChallengeController.createChallenge)
app.get('/educational/challenges/:dojoId/current', verifyToken, EducationalChallengeController.getCurrentChallenge)
app.get('/educational/challenges/:dojoId/all', verifyToken, EducationalChallengeController.getChallengesByDojo)
app.put('/educational/challenges/:id', verifyToken, EducationalChallengeController.updateChallenge)
app.get('/educational/challenges/:id/responses', verifyToken, EducationalChallengeController.getChallengeResponses)
app.get('/educational/challenges/:id/user-response', verifyToken, EducationalChallengeController.getUserResponse)
app.post('/educational/challenges/:id/response', verifyToken, EducationalChallengeController.submitResponse)
app.delete('/educational/challenges/:id', verifyToken, EducationalChallengeController.deleteChallenge)

module.exports = app
