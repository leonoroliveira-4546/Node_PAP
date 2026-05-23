const mongoose = require('mongoose')
const Tournament = require('../src/models/Predictions/TournamentModel')
const Users = require('../src/models/UsersModel')

const mongodb_url = 'mongodb+srv://leonormmoliveira:dbUserPassword@pap.wkyhqax.mongodb.net/PAP_db?appName=PAP'

(async () => {
  try {
    await mongoose.connect(mongodb_url)

    const tournaments = await Tournament.find({ dojo: null })

    const migrated = []
    const skipped = []

    for (const tournament of tournaments) {
      if (!tournament.createdBy) {
        skipped.push({ id: tournament._id.toString(), reason: 'missing createdBy' })
        continue
      }

      const user = await Users.findById(tournament.createdBy)
      if (!user || !user.dojoId) {
        skipped.push({ id: tournament._id.toString(), reason: 'missing user or dojoId' })
        continue
      }

      tournament.dojo = user.dojoId
      await tournament.save()
      migrated.push(tournament._id.toString())
    }

    if (skipped.length > 0) 
  } catch (err) {

  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
})()
