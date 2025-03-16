const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')

router.get('/', async (req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
})

router.post('/', async (req, res) => {
  const user = await prisma.user.create({
    data: req.body
  })
  res.status(201).json(user)
})

module.exports = router
