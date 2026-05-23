require("dotenv").config({
  path: "../../.env"
})

const express = require("express")
const cors = require("cors")

const youtubeRoutes = require("../routes/YoutubeApi/youtube")

const app = express()

app.use(cors())
app.use(express.json())

app.use("/youtube", youtubeRoutes)

app.listen(3000, () => {

})