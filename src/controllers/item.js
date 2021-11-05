const admin = require("firebase-admin")
const { v4: uuidv4 } = require('uuid')
const sharp = require('sharp')
const fs = require('fs')
const { base64encode, base64decode } = require('nodejs-base64')
const namer = require('color-namer')
const Item = require('../models/item')


const serviceAccount = JSON.parse(base64decode(process.env.FIREBASE_SERVICE_KEY))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "myntra-sense.appspot.com"
});

const storageRef = admin.storage().bucket();

const createItem = async (req, res) => {

    // console.log(req.body)

    // require('path').resolve(__dirname, '..')

    // creating public directory in the root folder if doesn't exists
    if (!fs.existsSync(`${__dirname}/../../public/`)) {
        fs.mkdirSync(`${__dirname}/../../public/`)
        console.log('directory created')
    }

    const filename = req.files.file.name
    const path = `${__dirname}/../../public/${filename}`
    const inputBuffer = req.files.file.data

    // console.log(filename)
    // console.log(path)
    // console.log(req.files.file.data)

    const sh = sharp(inputBuffer)
        .resize({
            width: 1000,
            height: 1000,
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy
        })

    try {
        await sh.toFile(path);
    }
    catch (e) {
        console.log(e)
    }


    const storage = await storageRef.upload(path, {
        public: true,
        destination: `/images/${filename}`,
        metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
        }
    });

    fs.unlinkSync(path)

    try {
        const item = new Item({
            ...req.body,
            imageUrl: storage[0].metadata.mediaLink,
        });
        await item.save()
        return res.status(201).send(item)
    } catch (e) {
        console.log(e)
        return res.send(e)
    }
}

const findSimilarItems = async (req, res) => {

    // req.body will contain base64 code which will be sent to ML model for classifying image (should be a square image)

    // API call to ML model

    // response will contain 2 params - color and type

    const identifiedColorName = 'rgb(0,0,255)'
    const identifiedType = 'shirt'

    const colorArr = namer(identifiedColorName, { pick: ['html'] }).html.filter((col) => col.distance <= 50.0)

    let SimilarParamsArr = []

    colorArr.forEach((color) => {
        SimilarParamsArr.push({color: color.name})
    })

    SimilarParamsArr.push({category: identifiedType})
    
    const items = await Item.find({$or: SimilarParamsArr})

    let itemsArray = []
    items.forEach(item => itemsArray.push(item))

    return res.send({ itemsArray: itemsArray })
}

const findMatchedItems = async (req, res) => {

    const items = await Item.find({})

    let itemsArray = []
    items.forEach(item => itemsArray.push(item))

    return res.send({ itemsArray: itemsArray })
}

module.exports = { findSimilarItems, findMatchedItems, createItem }