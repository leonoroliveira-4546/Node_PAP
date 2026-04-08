require("dotenv").config();
const express = require('express');
const path = require("path");
const mongoose = require("mongoose");
const cors= require("cors")

var bodyParser = require("body-parser");
var mongodb_url = "mongodb://localhost:27017/PAP_db";

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      'http://localhost:8100',
      'http://127.0.0.1:8100'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

//Rotas Públicas
const AuthRoute = require("./routes/AuthRoute");
const DojosRoute = require("./routes/DojosRoute");
const ComunidadeRoute = require("./routes/ComunidadeRoute");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(AuthRoute);
app.use(DojosRoute);
app.use(ComunidadeRoute);

mongoose.connect(mongodb_url)
  .then(result => {
    app.listen(8000, () => {
      console.log('Servidor rodando na porta 8000...')
    })
  })
  .catch(error => {
    console.log('Erro ao conectar com MongoDB:', error)
  })