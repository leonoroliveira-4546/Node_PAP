const mongoose = require('mongoose');
const Tournament = require('../src/models/Predictions/TournamentModel');
const Users = require('../src/models/UsersModel');

const mongodb_url = 'mongodb+srv://leonormmoliveira:dbUserPassword@pap.wkyhqax.mongodb.net/PAP_db?appName=PAP';

(async () => {
  try {
    await mongoose.connect(mongodb_url);
    console.log('Connected to MongoDB');

    const tournaments = await Tournament.find({ dojo: null });
    console.log('Found', tournaments.length, 'tournaments without dojo');

    const migrated = [];
    const skipped = [];

    for (const tournament of tournaments) {
      if (!tournament.createdBy) {
        skipped.push({ id: tournament._id.toString(), reason: 'missing createdBy' });
        continue;
      }

      const user = await Users.findById(tournament.createdBy);
      if (!user || !user.dojoId) {
        skipped.push({ id: tournament._id.toString(), reason: 'missing user or dojoId' });
        continue;
      }

      tournament.dojo = user.dojoId;
      await tournament.save();
      migrated.push(tournament._id.toString());
    }

    console.log('Migration finished');
    console.log('Migrated:', migrated.length);
    console.log('Skipped:', skipped.length);
    if (skipped.length > 0) console.log('Skipped details:', skipped);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
