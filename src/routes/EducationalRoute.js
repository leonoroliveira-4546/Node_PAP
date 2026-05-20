const express = require('express');
const app = express();

const EducationalController = require('../controllers/EducationalController');
const EducationalChallengeController = require('../controllers/EducationalChallengeController');
const verifyToken = require('../middlewares/is_auth');
const verifyAdmin = require('../middlewares/is_admin');

app.get('/educational', verifyToken, EducationalController.getContent);
app.post('/educational', verifyToken, verifyAdmin, EducationalController.createContent);
app.put('/educational/:id', verifyToken, verifyAdmin, EducationalController.updateContent);

// Challenges for dojos
app.post('/educational/challenges', verifyToken, EducationalChallengeController.createChallenge);
app.get('/educational/challenges/:dojoId/current', verifyToken, EducationalChallengeController.getCurrentChallenge);
app.post('/educational/challenges/:id/response', verifyToken, EducationalChallengeController.submitResponse);
app.delete('/educational/challenges/:id', verifyToken, EducationalChallengeController.deleteChallenge);

module.exports = app;
