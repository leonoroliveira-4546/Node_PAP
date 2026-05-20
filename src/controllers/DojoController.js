const Dojos = require("../models/Dojo/DojosModel");
const Tournament = require("../models/Predictions/TournamentModel");
const Users = require("../models/UsersModel");

const normalizeParticipants = async (participants = []) => {
    if (!Array.isArray(participants)) return [];

    const normalized = [];
    for (const item of participants) {
        if (!item) continue;

        if (typeof item === 'string') {
            const user = await Users.findById(item).lean();
            normalized.push({
                name: user?.username || 'Participante',
                belt: user?.belt || 'Branca',
                userId: item
            });
            continue;
        }

        if (typeof item === 'object') {
            const userId = item.userId || item._id;
            if (userId) {
                const user = await Users.findById(userId).lean();
                normalized.push({
                    name: item.name || user?.username || 'Participante',
                    belt: item.belt || user?.belt || 'Branca',
                    userId
                });
            } else {
                normalized.push({
                    name: item.name || 'Participante',
                    belt: item.belt || 'Branca',
                    userId: null
                });
            }
        }
    }
    return normalized;
};

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

    getAthletesWithoutDojo: async (req, res) => {
        try {
            const Users = require("../models/UsersModel");
            
            // Buscar atletas que não têm dojoId
            const athletes = await Users.find({ 
                dojoId: null,
                type: 'athlete'
            }).select('username email _id');

            res.json({ success: true, athletes });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    getDojoMembers: async (req, res) => {
        try {
            const { dojoId } = req.params;

            const dojo = await Dojos.findById(dojoId)
                .populate("members", "username email type childrens birthDate")
                .populate("joinRequests.user", "username email");

            if (!dojo) {
                return res.status(404).json({ success: false, message: "Dojo não encontrado" });
            }

            // Criar lista de membros reais
            const realMembers = [];

            for (const member of dojo.members) {
                if (member._id) {
                    if (member.type === 'responsavel' && member.childrens && member.childrens.length > 0) {
                        // Se for responsável com filhos, adicionar os filhos como membros
                        for (const child of member.childrens) {
                            realMembers.push({
                                _id: child._id,
                                username: child.username,
                                birthDate: child.birthDate,
                                type: 'athlete',
                                parentId: member._id,
                                parentUsername: member.username
                            });
                        }
                    } else {
                        // Se não for responsável ou não tiver filhos, adicionar o próprio usuário
                        realMembers.push({
                            _id: member._id,
                            username: member.username,
                            email: member.email,
                            type: member.type,
                            birthDate: member.birthDate
                        });
                    }
                }
            }

            res.json({ success: true, members: realMembers, dojo: { ...dojo.toObject(), members: realMembers } });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    inviteMember: async (req, res) => {
        try {
            const { dojoId } = req.params;
            const { email } = req.body;
            const userId = req.user?._id; // from verifyToken middleware

            if (!email) return res.status(400).json({ success: false, error: 'Email necessário' });

            const dojo = await Dojos.findById(dojoId);
            if (!dojo) return res.status(404).json({ success: false, error: 'Dojo não encontrado' });

            // Evitar convites duplicados
            const exists = dojo.invites && dojo.invites.find(i => i.email === email && i.status === 'pending');
            if (exists) return res.json({ success: false, error: 'Convite já enviado' });

            dojo.invites.push({ email, invitedBy: userId, status: 'pending' });
            await dojo.save();

            return res.json({ success: true, message: 'Convite enviado', invite: { email } });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    submitJoinRequest: async (req, res) => {
        try {
            const { dojoId } = req.params;
            const userId = req.user?._id;

            const dojo = await Dojos.findById(dojoId);
            if (!dojo) return res.status(404).json({ success: false, error: 'Dojo não encontrado' });

            const already = dojo.joinRequests && dojo.joinRequests.find(r => r.user.toString() === userId);
            if (already) return res.json({ success: false, error: 'Pedido já enviado' });

            dojo.joinRequests.push({ user: userId });
            await dojo.save();

            return res.json({ success: true, message: 'Pedido enviado' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    acceptJoinRequest: async (req, res) => {
        try {
            const { dojoId, userId } = req.params;

            const dojo = await Dojos.findById(dojoId);
            if (!dojo) return res.status(404).json({ success: false, error: 'Dojo não encontrado' });

            // Remover do joinRequests
            dojo.joinRequests = dojo.joinRequests.filter(r => r.user.toString() !== userId);
            // Adicionar aos membros se ainda não estiver
            if (!dojo.members.find(m => m.toString() === userId)) {
                dojo.members.push(userId);
            }

            // Atualizar o usuário para refletir que agora faz parte deste dojo
            await Users.findByIdAndUpdate(userId, { dojoId: dojo._id });

            await dojo.save();

            return res.json({ success: true, message: 'Pedido aceite' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    rejectJoinRequest: async (req, res) => {
        try {
            const { dojoId, userId } = req.params;

            const dojo = await Dojos.findById(dojoId);
            if (!dojo) return res.status(404).json({ success: false, error: 'Dojo não encontrado' });

            dojo.joinRequests = dojo.joinRequests.filter(r => r.user.toString() !== userId);
            await dojo.save();

            return res.json({ success: true, message: 'Pedido rejeitado' });
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

    removeChildFromResponsible: async (req, res) => {
        try {
            const { responsibleId, childId } = req.body;

            const Users = require("../models/UsersModel");
            const responsible = await Users.findById(responsibleId);

            if (!responsible) {
                return res.status(404).json({ success: false, message: "Responsável não encontrado" });
            }

            responsible.childrens = responsible.childrens.filter(
                child => child._id.toString() !== childId
            );
            await responsible.save();

            res.json({ success: true, message: "Filho removido com sucesso" });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    createTournament: async (req, res) => {
        try {
            const { name, date, location, userId, participants } = req.body;
            const { dojoId } = req.params;

            // Validar data: não permitir datas anteriores ao dia atual
            const tournamentDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            tournamentDate.setHours(0, 0, 0, 0);

            if (isNaN(tournamentDate.getTime())) {
                return res.status(400).json({ success: false, error: 'Data inválida' });
            }

            if (tournamentDate < today) {
                return res.status(400).json({ success: false, error: 'Data do torneio não pode ser anterior à data atual' });
            }

            const normalizedParticipants = await normalizeParticipants(participants);
            const tournament = new Tournament({
                name,
                date,
                location,
                dojo: dojoId,
                participants: normalizedParticipants,
                createdBy: userId
            });
            await tournament.save();

            console.log('createTournament: saved tournament', { dojoId, tournamentId: tournament._id, name, date, location, createdBy: userId });

            res.status(201).json({ success: true, tournament });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    getDojoTournaments: async (req, res) => {
        try {
            const { dojoId } = req.params;
            const userId = req.user?._id;

            console.log('getDojoTournaments: dojoId=', dojoId, 'userId=', userId);

            const query = userId ? {
                $and: [
                    { participants: { $size: 0 } },
                    {
                        $or: [
                            { dojo: dojoId },
                            { dojo: null, createdBy: userId }
                        ]
                    }
                ]
            } : {
                dojo: dojoId,
                participants: { $size: 0 }
            };

            const tournaments = await Tournament.find(query)
                .sort({ date: 1 })
                .populate('participants.userId', 'username email');

            console.log('getDojoTournaments: found', (tournaments || []).length, 'tournaments for dojo', dojoId);
            if (tournaments && tournaments.length > 0) {
                console.log('getDojoTournaments sample[0]=', tournaments[0]);
            }

            res.json({ success: true, tournaments });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    migrateTournamentsToDojo: async (req, res) => {
        try {
            const tournaments = await Tournament.find({ dojo: null });
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

            res.json({ success: true, migratedCount: migrated.length, migrated, skipped });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    updateTournament: async (req, res) => {
        try {
            const { tournamentId } = req.params;
            const { name, date, location, participants } = req.body;

            const updateData = { name, date, location };
            if (participants) {
                updateData.participants = await normalizeParticipants(participants);
            }

            const tournament = await Tournament.findByIdAndUpdate(
                tournamentId,
                updateData,
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