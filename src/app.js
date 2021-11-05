const express = require('express')
const path = require('path')
const cors = require('cors')
const fileupload = require("express-fileupload");
const app = express()
const { base64encode, base64decode } = require('nodejs-base64')
 
app.use(fileupload());

// setting path for env variables
// require('dotenv').config({path:path.resolve(__dirname, '../config/dev.env') })
require('dotenv').config({path:path.resolve(__dirname, '../config/prod.env') })

const matchingRoutes = require('./routes/item')
  
require('./db/mongoose')

// enabling cors
app.use(cors())

// setting path for serving static files
app.use(express.static('public'))

app.use(express.json())

app.get('/',(req,res)=>{
    res.send('Working...')
})

app.use('/item',matchingRoutes)

app.use((err,req,res,next) => {
    res.status(500).json({message: err.message})
})

module.exports = app 