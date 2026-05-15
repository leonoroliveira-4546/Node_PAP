const fs = require('fs');
const sendResponsavelInviteEmail = require("../utils/sendResponsavelInviteEmail");
const sendVerificationEmail = require("../utils/sendVerificationEmail");
const generateInviteToken = require("../utils/generateInviteToken");
const verifyInviteToken = require("../utils/verifyInviteToken");
const Users = require("../models/UsersModel");
const Performance = require("../models/Dojo/PerformanceModel");
const { uploadToCloudinary } = require("../middlewares/upload");
const admin = require("../config/firebase");

const normalizeType = (type) => {
    if (type === 'atleta') return 'athlete';
    return type;
};

const normalizeUserObject = (user) => {
    if (!user) return user;
    const normalized = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    normalized.type = normalizeType(normalized.type);
    return normalized;
};

const buildProfileResponse = async (user) => {
    const normalizedUser = normalizeUserObject(user);
    normalizedUser.ranking = null;
    normalizedUser.tournamentParticipations = 0;
    normalizedUser.tournamentVictories = 0;
    normalizedUser.childrenStats = [];

    const athleteRankingUsers = await Users.find({ type: { $in: ['athlete', 'atleta'] } })
        .select('points')
        .sort({ points: -1, username: 1 });

    const rankingMap = new Map();
    athleteRankingUsers.forEach((u, index) => rankingMap.set(u._id.toString(), index + 1));

    if (normalizeType(user.type) === 'athlete') {
        normalizedUser.ranking = rankingMap.get(user._id.toString()) || null;
        normalizedUser.tournamentParticipations = await Performance.countDocuments({ athlete: user._id });
    }

    if (normalizeType(user.type) === 'responsavel') {
        const childAthleteDocs = await Users.find({ responsavelId: user._id, type: { $in: ['athlete', 'atleta'] } })
            .select('username name profilePic belt points dojoId');

        const childDocsStats = childAthleteDocs.map(child => ({
            ...child.toObject(),
            ranking: rankingMap.get(child._id.toString()) || null
        }));

        const embeddedChildren = (user.childrens || []).map(child => ({
            _id: String(child._id),
            username: child.username,
            name: child.username,
            profilePic: null,
            belt: 'Branca',
            points: 0,
            ranking: null,
            dojoId: user.dojoId
        }));

        normalizedUser.childrenStats = childDocsStats.length ? childDocsStats : embeddedChildren;
        normalizedUser.tournamentParticipations = childAthleteDocs.length
            ? await Performance.countDocuments({ childId: { $in: childAthleteDocs.map(c => c._id) } })
            : 0;
    }

    return normalizedUser;
};

const AuthController = {
    login: async (req, res) => {
        const { idToken } = req.body;

        try {
            //Verificar o token no Firebase
            const decoded = await admin.auth().verifyIdToken(idToken);
            const user = await Users.findOne({ authUid: decoded.uid })

            if (!user) {
                return res.status(404).json({success: false, message: 'Usuário não encontrado' });
            }

            if (!decoded.email_verified) {
                return res.status(403).json({success: false, message: 'Email não verificado. Verifique sua caixa de entrada.' });
            }

            if (!user.emailVerified) {
                user.emailVerified = true;
                user.status = 'active';
                await user.save();
            }

            res.cookie("auth", idToken, { httpOnly: true, secure: false, sameSite: "Lax" });
            const userProfile = await buildProfileResponse(user);
            return res.json({success: true, user: userProfile, message: 'Login efetuado com sucesso' });
        } catch (err) {
            return res.status(401).json({success: false, message: 'Token inválido ou expirado'});
        }
    },

    register: async (req, res) => {
        const { username, email, password, type,  birthDate, dojoId, responsavelId, childrens} = req.body;

        try {
            const existingUserByEmail = await Users.findOne({ email });
            if (existingUserByEmail) {
                return res.status(400).json({success: false, message: "Já existe um usuário com esse email." });
            }

            if (type === 'athlete' && !birthDate) {
                return res.status(400).json({success: false, message: 'Por favor, preenche a data de nascimento.'});
            }

            if (type === 'responsavel' && (!childrens || childrens.length === 0)) {
                return res.status(400).json({success: false, message: "Responsável precisa ter pelo menos um filho." });
            }

            const firebaseUser = await admin.auth().createUser({
                email,
                password,
                displayName: username
            });

            const verficationLink = await admin.auth().generateEmailVerificationLink(email);
            await sendVerificationEmail(email, verficationLink);

            const newUser = await Users.create({
                authUid: firebaseUser.uid,
                username,
                name: username,
                email,
                type,
                belt: 'Branca',
                birthDate: type === 'athlete' ? birthDate: null,
                responsavelId: responsavelId || null,
                childrens: type === 'responsavel' ? childrens : [],
                dojoId: dojoId || null,
                status: 'pending',
                emailVerified: false
            });
            
            return res.status(201).json({success: true, message: "Usuário criado com sucesso. Verifique seu e-mail.", user: newUser });
        } catch (err) {
            console.log(err);
            if (firebaseUser?.uid) {
                await admin.auth().deleteUser(firebaseUser.uid);
            }

            return res.status(500).json({success: false, message: "Erro ao criar o usuário", error: err.message });
        }
    },

    logout: async (req, res) => {
        res.clearCookie("auth", { httpOnly: true, secure: false, sameSite: "Lax" });
        return res.status(200).send({success: true, message: "Logout efetuado com sucesso" });
    },

    getProfile: async (req, res) => {
        try {
            const user = await Users.findById(req.user._id).select('-__v');
            if (!user) {
                return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
            }

            const userWithRanking = await buildProfileResponse(user);
            return res.json({ success: true, user: userWithRanking });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Erro ao buscar perfil.' });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const user = await Users.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
            }

            const { username, name, belt } = req.body;
            if (username) user.username = username.trim();
            if (name) user.name = name.trim();
            if (belt) user.belt = belt;

            if (req.file) {
                let buffer = req.file.buffer;
                if (!buffer && req.file.path) {
                    buffer = await fs.promises.readFile(req.file.path);
                }

                if (buffer) {
                    const uploaded = await uploadToCloudinary(buffer);
                    user.profilePic = uploaded.url;
                }
            }

            await user.save();
            const userProfile = await buildProfileResponse(user);
            return res.json({ success: true, user: userProfile });
        } catch (err) {
            console.error('updateProfile error:', err);
            return res.status(500).json({ success: false, message: 'Erro ao atualizar perfil.', error: err.message });
        }
    },

    changePassword: async (req, res) => {
        try {
            const { newPassword } = req.body;
            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'A nova senha deve ter pelo menos 6 caracteres.' });
            }

            if (!req.user || !req.user.authUid) {
                return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
            }

            await admin.auth().updateUser(req.user.authUid, { password: newPassword });
            return res.json({ success: true, message: 'Senha atualizada com sucesso.' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Erro ao alterar senha.' });
        }
    },

    getRanking: async (req, res) => {
        try {
            const athleteUsers = await Users.find({ type: { $in: ['athlete', 'atleta'] } })
                .select('username name profilePic type belt points dojoId')
                .lean();

            const responsavelParents = await Users.find({ type: 'responsavel' })
                .select('childrens dojoId')
                .lean();

            const embeddedChildren = responsavelParents.flatMap(parent => (parent.childrens || []).map(child => ({
                _id: String(child._id),
                username: child.username,
                name: child.username,
                profilePic: null,
                type: 'athlete',
                belt: 'Branca',
                points: 0,
                dojoId: parent.dojoId
            })));

            const combinedUsers = [
                ...athleteUsers.map(user => ({
                    ...user,
                    type: normalizeType(user.type)
                })),
                ...embeddedChildren
            ];

            const sortedRanking = combinedUsers.sort((a, b) => {
                if ((b.points || 0) !== (a.points || 0)) {
                    return (b.points || 0) - (a.points || 0);
                }
                return a.username.localeCompare(b.username);
            });

            const generalRanking = sortedRanking.map((user, index) => ({
                ...user,
                ranking: index + 1
            }));

            let dojoRanking = [];
            if (req.user?.dojoId) {
                dojoRanking = generalRanking.filter(user => String(user.dojoId) === String(req.user.dojoId));
            }

            return res.json({ success: true, general: generalRanking, dojo: dojoRanking });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Erro ao buscar ranking.' });
        }
    },

    calculateAge: async (req, res) => {
        const {birthDate} = req.body;

        const today = new Date();
        const birth = new Date(birthDate);
            
        let age = today.getFullYear() - birth.getFullYear();
        const month = today.getMonth() - birth.getMonth();
            
        if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return res.status(200).json(age);
    },

    inviteResponsavel: async (req, res) => {
        const { email, athleteName } = req.body;

        try {
            const responsavel = await Users.findOne({ email, type: "responsavel" });
            if (!responsavel) {
                return res.status(404).json({success: false, message: "Responsável não encontrado" });
            }

            const token = generateInviteToken({
                athleteName,
                responsavelId: responsavel._id.toString()
            });

            const link = `http://localhost:8100/signup/confirm-responsavel?token=${token}`;

            await sendResponsavelInviteEmail(
                email,
                athleteName,
                link
            );

            return res.json({success: true, message: "Convite enviado" });
        } catch (err) {
            return res.status(500).json({success: false, message: "Erro ao enviar convite" });
        }
    },

    confirmResponsavelInvite: async (req, res) => {
        const { token } = req.body;

        try {
            const decoded = verifyInviteToken(token);

            return res.json({success: true, responsavelId: decoded.responsavelId });
        } catch (err) {
            return res.status(400).json({success: false, message: "Token inválido ou expirado" });
        }
    },

    addPerformance: async (req, res) => {
        try {
            const { athleteId, childId, rating, improvements, needsImprovement } = req.body;

            if (!athleteId && !childId) {
                return res.status(400).json({ success: false, message: "É necessário athleteId ou childId" });
            }

            let query = {};
            if (athleteId) {
                query.athlete = athleteId;
            } else {
                query.childId = childId;
            }

            const existingPerformance = await Performance.findOne(query).sort({ date: -1 });

            const currentMonth = new Date().toISOString().slice(0, 7);

            if (existingPerformance) {
                // Update existing
                existingPerformance.rating = rating;
                existingPerformance.feedback.improvements = improvements;
                existingPerformance.feedback.needsImprovement = needsImprovement;
                existingPerformance.month = currentMonth; // Add month if missing
                existingPerformance.date = new Date();
                await existingPerformance.save();
                return res.json({ success: true, performance: existingPerformance });
            } else {
                // Create new
                const performance = new Performance({
                    athlete: athleteId || null,
                    childId: childId || null,
                    rating,
                    feedback: {
                        improvements,
                        needsImprovement
                    },
                    month: currentMonth
                });
                await performance.save();
                return res.json({ success: true, performance });
            }
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    getAthletePerformance: async (req, res) => {
        try {
            const { athleteId, childId } = req.query;

            let query = {};

            if (athleteId) {
                query.athlete = athleteId;
            } else if (childId) {
                query.childId = childId;
            } else {
                return res.status(400).json({ success: false, message: "Falta athleteId ou childId" });
            }

            const performance = await Performance.findOne(query)
                .sort({ date: -1 });

            if (performance && !performance.month) {
                performance.month = performance.date.toISOString().slice(0, 7);
                await performance.save();
            }

            res.json({ success: true, performance });
        } catch (err) {
        res.status(500).json({ success: false, error: err.message });
        }
    },

    addAbsence: async (req, res) => {
        try {
            const { userId, childId, date, reason } = req.body;

            const user = await Users.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: "User não encontrado" });
            }

            const absenceDate = new Date(date);
            const month = absenceDate.toISOString().slice(0, 7);

            if (childId) {
                const child = user.childrens.find(c => c._id.toString() === childId);
                if (!child) {
                    return res.status(404).json({ success: false, message: "Filho não encontrado" });
                }

                const existingMonth = child.absences.find(a => a.month === month);
                if (existingMonth) {
                    existingMonth.count += 1;
                } else {
                    child.absences.push({ month, count: 1, reason: reason || "other" });
                }

                await user.save();
                return res.json({ success: true, absences: child.absences });
            }

            const existingMonth = user.absences.find(a => a.month === month);

            if (existingMonth) {
                existingMonth.count += 1;
            } else {
                user.absences.push({ month, count: 1, reason: reason || "other" });
            }
            await user.save();

            res.json({ success: true, absences: user.absences });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    getAbsencesByMonth: async (req, res) => {
        try {
            const { userId } = req.params;
            const { month } = req.query;

            if (!month) {
                return res.status(400).json({ success: false, message: "Mês é obrigatório (formato: YYYY-MM)" });
            }   

            const user = await Users.findById(userId).select("absences");

            if (!user) {
                return res.status(404).json({ success: false, message: "User não encontrado" });
            }

            const absence = user.absences.find(a => a.month === month);

            return res.json({
                success: true,
                month,
                count: absence ? absence.count : 0,
                absence: absence || { month, count: 0, reason: null }
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
};

module.exports = AuthController;