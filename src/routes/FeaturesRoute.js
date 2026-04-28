const express = require('express');
const app = express();
app.use(express.json());

const verifyToken = require('../middlewares/is_auth');
const FeaturesController = require('../controllers/FeaturesController');

app.get('/plans', verifyToken, FeaturesController.getPlans);
app.get('/plans/current', verifyToken, FeaturesController.getCurrentPlan);
app.post('/plans/subscribe', verifyToken, FeaturesController.subscribePlan);

app.get('/predictions/tournaments', verifyToken, FeaturesController.getPredictionTournaments);
app.get('/predictions/my', verifyToken, FeaturesController.getMyPredictions);
app.post('/predictions', verifyToken, FeaturesController.submitPrediction);

app.get('/shop/products', verifyToken, FeaturesController.getShopProducts);
app.get('/educational/videos', verifyToken, FeaturesController.getEducationalVideos);

module.exports = app;
