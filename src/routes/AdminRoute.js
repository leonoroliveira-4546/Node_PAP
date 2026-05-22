const express = require('express');
const app = express();

const AdminController = require('../controllers/AdminController');
const verifyToken = require('../middlewares/is_auth');
const verifyAdmin = require('../middlewares/is_admin');

app.get('/admin/users', verifyToken, verifyAdmin, AdminController.getUsers);
app.put('/admin/users/:id', verifyToken, verifyAdmin, AdminController.updateUser);
app.delete('/admin/users/:id', verifyToken, verifyAdmin, AdminController.deleteUser);
app.post('/admin/reset-ranking', verifyToken, verifyAdmin, AdminController.resetRanking);

module.exports = app;
