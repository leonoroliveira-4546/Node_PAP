const express = require('express')
const app = express()

const PredictionsController = require('../controllers/PredictionsController')
const verifyToken = require('../middlewares/is_auth')
const verifyAdmin = require('../middlewares/is_admin')

app.get('/predictions/tournaments', verifyToken, PredictionsController.getTournaments)
app.get('/predictions/my', verifyToken, PredictionsController.getMyPredictions)
app.post('/predictions', verifyToken, PredictionsController.submitPrediction)
app.post('/predictions/tournaments', verifyToken, verifyAdmin, PredictionsController.createTournament)
app.put('/predictions/tournaments/:id', verifyToken, verifyAdmin, PredictionsController.updateTournament)
app.delete('/predictions/tournaments/:id', verifyToken, verifyAdmin, PredictionsController.deleteTournament)

module.exports = app
