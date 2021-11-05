const admin = require("firebase-admin")
const { v4: uuidv4 } = require('uuid')
const sharp = require('sharp')
const fs = require('fs')
const { base64encode, base64decode } = require('nodejs-base64')
const Item = require('../models/item')


const serviceAccount = JSON.parse(base64decode(process.env.FIREBASE_SERVICE_KEY))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "myntra-sense.appspot.com"
});

const storageRef = admin.storage().bucket();

const createItem = async (req, res) => {

    // console.log(req.body)

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

    const items = await Item.find({})

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