const express = require('express')

const {findSimilarItems, findMatchedItems, createItem} = require('../controllers/item')

const router = new express.Router()

router.post('/findSimilarItems',findSimilarItems)

router.post('/findMatchedItems',findMatchedItems)

router.post('/createItem', createItem)

module.exports =  router