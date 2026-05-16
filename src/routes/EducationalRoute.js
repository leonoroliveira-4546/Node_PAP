const express = require('express');
const app = express();

const EducationalController = require('../controllers/EducationalController');
const verifyToken = require('../middlewares/is_auth');
const verifyAdmin = require('../middlewares/is_admin');

app.get('/educational', verifyToken, EducationalController.getContent);
app.post('/educational', verifyToken, verifyAdmin, EducationalController.createContent);
app.put('/educational/:id', verifyToken, verifyAdmin, EducationalController.updateContent);

module.exports = app;
