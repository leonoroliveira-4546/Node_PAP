const Challenge = require('../models/Educational/ChallengeModel')
const ChallengeResponse = require('../models/Educational/ChallengeResponseModel')
const Users = require('../models/UsersModel')

const EducationalChallengeController = {
  createChallenge: async (req, res) => {
    try {
      const { title, description, dojoId, date, type, options, correctAnswer, points, expireAt } = req.body
      if (!req.user || !['sensei', 'admin'].includes(req.user.type)) {
        return res.status(403).json({ success: false, message: 'Permissão negada.' })
      }

      const challenge = await Challenge.create({
        title,
        description,
        dojoId,
        date,
        type,
        options,
        correctAnswer,
        points: points || 20,
        createdBy: req.user._id,
        expireAt: expireAt ? new Date(expireAt) : (date ? new Date(new Date(`${date}T23:59:59`)) : null)
      })

      return res.status(201).json({ success: true, challenge })
    } catch (err) {

      return res.status(500).json({ success: false, message: 'Erro ao criar desafio.' })
    }
  },

  getCurrentChallenge: async (req, res) => {
    try {
      const { dojoId } = req.params
      const today = new Date().toISOString().slice(0, 10)
      const now = new Date()
      const challenge = await Challenge.findOne({
        dojoId,
        $and: [
          { $or: [ { date: today }, { date: { $exists: false } }, { date: '' } ] },
          { $or: [ { expireAt: null }, { expireAt: { $gt: now } } ] }
        ]
      }).sort({ createdAt: -1 })

      if (!challenge) return res.json({ success: true, challenge: null })
      return res.json({ success: true, challenge })
    } catch (err) {

      return res.status(500).json({ success: false, message: 'Erro ao buscar desafio.' })
    }
  },

  getChallengesByDojo: async (req, res) => {
    try {
      const { dojoId } = req.params
      const challenges = await Challenge.find({ dojoId }).sort({ createdAt: -1 })
      return res.json({ success: true, challenges })
    } catch (err) {

      return res.status(500).json({ success: false, message: 'Erro ao buscar desafios.' })
    }
  },

  getChallengeResponses: async (req, res) => {
    try {
      const { id } = req.params
      const responses = await ChallengeResponse.find({ challengeId: id }).sort({ createdAt: -1 })
      return res.json({ success: true, responses })
    } catch (err) {

      return res.status(500).json({ success: false, message: 'Erro ao buscar respostas.' })
    }
  },

  getUserResponse: async (req, res) => {
    try {
      const { id } = req.params
      const user = req.user
      if (!user) return res.status(401).json({ success: false, message: 'Autenticação necessária.' })
      const response = await ChallengeResponse.findOne({ challengeId: id, athleteId: user._id })
      return res.json({ success: true, answered: !!response, response })
    } catch (err) {

      return res.status(500).json({ success: false, message: 'Erro ao buscar resposta do usuário.' })
    }
  },

  submitResponse: async (req, res) => {
    try {
      const { id } = req.params; // challenge id
      const { response } = req.body
      const user = req.user
      if (!user) return res.status(401).json({ success: false, message: 'Autenticação necessária.' })

      const challenge = await Challenge.findById(id)
      if (!challenge) return res.status(404).json({ success: false, message: 'Desafio não encontrado.' })

      if (challenge.expireAt && new Date() > new Date(challenge.expireAt)) {
        return res.status(410).json({ success: false, message: 'Desafio expirado.' })
      }

      const existing = await ChallengeResponse.findOne({ challengeId: id, athleteId: user._id })
      if (existing) return res.status(400).json({ success: false, message: 'Você já respondeu a este desafio.' })

      const correct = (challenge.correctAnswer || '').trim().toLowerCase() === (response || '').trim().toLowerCase()
      const pointsEarned = correct ? (challenge.points || 0) : 0

      const resp = await ChallengeResponse.create({
        challengeId: id,
        athleteId: user._id,
        athleteName: user.username,
        response,
        correct,
        pointsEarned
      })

      if (correct) {
        await Users.findByIdAndUpdate(user._id, { $inc: { points: pointsEarned } })
      }

      return res.json({ success: true, resp, pointsEarned, correct })
    } catch (err) {

      return res.status(500).json({ success: false, message: 'Erro ao salvar resposta.' })
    }
  },

  updateChallenge: async (req, res) => {
    try {
      const { id } = req.params
      const { title, description, date, type, options, correctAnswer, points, expireAt } = req.body
      if (!req.user || !['sensei', 'admin'].includes(req.user.type)) {
        return res.status(403).json({ success: false, message: 'Permissão negada.' })
      }

      const challenge = await Challenge.findById(id)
      if (!challenge) return res.status(404).json({ success: false, message: 'Desafio não encontrado.' })
      if (req.user.type === 'sensei' && challenge.dojoId.toString() !== req.user.dojoId?.toString()) {
        return res.status(403).json({ success: false, message: 'Permissão negada.' })
      }

      challenge.title = title
      challenge.description = description
      challenge.date = date
      challenge.type = type
      challenge.options = options
      challenge.correctAnswer = correctAnswer
      challenge.points = points || 20
      challenge.expireAt = expireAt ? new Date(expireAt) : (date ? new Date(new Date(`${date}T23:59:59`)) : null)
      await challenge.save()

      return res.json({ success: true, challenge })
    } catch (err) {

      return res.status(500).json({ success: false, message: 'Erro ao atualizar desafio.' })
    }
  },

  deleteChallenge: async (req, res) => {
    try {
      const { id } = req.params
      if (!req.user || !['sensei', 'admin'].includes(req.user.type)) {
        return res.status(403).json({ success: false, message: 'Permissão negada.' })
      }

      const challenge = await Challenge.findById(id)
      if (!challenge) return res.status(404).json({ success: false, message: 'Desafio não encontrado.' })
      if (req.user.type === 'sensei' && challenge.dojoId.toString() !== req.user.dojoId?.toString()) {
        return res.status(403).json({ success: false, message: 'Permissão negada.' })
      }

      await challenge.remove()
      await ChallengeResponse.deleteMany({ challengeId: id })
      return res.json({ success: true, message: 'Desafio removido.' })
    } catch (err) {

      return res.status(500).json({ success: false, message: 'Erro ao remover desafio.' })
    }
  }
}

module.exports = EducationalChallengeController
