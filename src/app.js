require("dotenv").config();
const express = require('express');
const http = require('http');
const path = require("path");
const mongoose = require("mongoose");
const cors= require("cors");
const { initializeSocket } = require('./socket/socketHandler');

var bodyParser = require("body-parser");
var mongodb_url = "mongodb+srv://leonormmoliveira:dbUserPassword@pap.wkyhqax.mongodb.net/PAP_db?appName=PAP";

const app = express();
const server = http.createServer(app);

app.use((req, res, next) => {
  res.setHeader(
    "Cross-Origin-Opener-Policy",
    "same-origin-allow-popups"
  );

  next();
});

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
const ChatRoute = require("./routes/ChatRoute");
const YoutubeRoute = require("./routes/YoutubeApi/youtube");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(AuthRoute);
app.use(DojosRoute);
app.use(ComunidadeRoute);
app.use(ChatRoute);
app.use("/youtube", YoutubeRoute);

mongoose.connect(mongodb_url)
  .then(result => {
    server.listen(8001, () => {
      console.log('Servidor rodando na porta 8001...')
    })
    initializeSocket(server);
  })
  .catch(error => {
    console.log('Erro ao conectar com MongoDB:', error)
  })