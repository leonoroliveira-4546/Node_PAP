const Dojos = require("../models/Dojo/DojosModel");
const Tournament = require("../models/Dojo/TournamentModel");

const DojoController = {
    createDojo: async (req, res) => {
        try {
            const { name, city, userId } = req.body;

            const dojo = new Dojos({
                name,
                city,
                sensei: userId
            });

            await dojo.save();

            res.status(201).json({ success: true, dojo });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    getDojos: async (req, res) => {
        try {
            const dojos = await Dojos.find();

            res.json({ success: true, dojos });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    joinDojo: async (req, res) => {
        try {
            const { dojoId, userId } = req.body;
            const dojo = await Dojos.findById(dojoId);

            if (!dojo) {
                return res.status(404).json({ success: false, error: "Dojo não encontrado" });
            }

            if (!dojo.members.includes(userId)) {
                dojo.members.push(userId);
            }
            await dojo.save();

            res.json({ success: true, dojo });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    removeMember: async (req, res) => {
        try {
            const { dojoId, userId } = req.body;

            const dojo = await Dojos.findById(dojoId);

            if (!dojo) {
                return res.status(404).json({ success: false, message: "Dojo não encontrado" });
            }

            dojo.members = dojo.members.filter(
                member => member.toString() !== userId
            );
            await dojo.save();

            res.json({ success: true, dojo });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    getDojoMembers: async (req, res) => {
        try {
            const { dojoId } = req.params;

            const dojo = await Dojos.findById(dojoId)
                .populate("members.id");

            if (!dojo) {
                return res.status(404).json({ success: false, message: "Dojo não encontrado" });
            }

            res.json({ success: true, dojo });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    addTrainingSchedule: async (req, res) => {
        try {
            const { dojoId } = req.params;
            const { day, time, location } = req.body;

            const dojo = await Dojos.findById(dojoId);

            if (!dojo) {
                return res.status(404).json({ success: false, message: "Dojo não encontrado" });
            }

            dojo.trainingSchedule.push({ day, time, location });
            await dojo.save();

            res.json({ success: true, dojo });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    updateTrainingSchedules: async (req, res) => {
        try {
            const { dojoId } = req.params;
            const { schedules } = req.body;

            const dojo = await Dojos.findById(dojoId);

            if (!dojo) {
                return res.status(404).json({ success: false, message: "Dojo não encontrado" });
            }

            dojo.trainingSchedule = schedules;
            await dojo.save();

            res.json({ success: true, dojo });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    createTournament: async (req, res) => {
        try {
            const { name, date, location, userId } = req.body;
            const { dojoId } = req.params;

            const tournament = new Tournament({
                name,
                date,
                location,
                dojo: dojoId,
                createdBy: userId
            });
            await tournament.save();

            res.status(201).json({ success: true, tournament });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    getDojoTournaments: async (req, res) => {
        try {
            const { dojoId } = req.params;

            const tournaments = await Tournament.find({ dojo: dojoId })
                .sort({ date: 1 });

            res.json({ success: true, tournaments });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    updateTournament: async (req, res) => {
        try {
            const { tournamentId } = req.params;
            const { name, date, location } = req.body;

            const tournament = await Tournament.findByIdAndUpdate(
                tournamentId,
                { name, date, location },
                { new: true }
            );

            if (!tournament) {
                return res.status(404).json({ success: false, message: "Torneio não encontrado" });
            }

            res.json({ success: true, tournament });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    deleteTournament: async (req, res) => {
        try {
            const { tournamentId } = req.params;

            const tournament = await Tournament.findByIdAndDelete(tournamentId);

            if (!tournament) {
                return res.status(404).json({ success: false, message: "Torneio não encontrado" });
            }

            res.json({ success: true, message: "Torneio removido com sucesso" });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
};

module.exports = DojoController;