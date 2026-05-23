const express = require('express')
const app = express()

const PlansController = require('../controllers/PlansController')
const verifyToken = require('../middlewares/is_auth')
const verifyAdmin = require('../middlewares/is_admin')

app.get('/plans', verifyToken, PlansController.getPlans)
app.post('/plans', verifyToken, verifyAdmin, PlansController.createPlan)
app.put('/plans/:id', verifyToken, verifyAdmin, PlansController.updatePlan)

module.exports = app