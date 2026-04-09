const sendResponsavelInviteEmail = require("../utils/sendResponsavelInviteEmail");
const sendVerificationEmail = require("../utils/sendVerificationEmail");
const generateInviteToken = require("../utils/generateInviteToken");
const verifyInviteToken = require("../utils/verifyInviteToken");
const Users = require("../models/UsersModel");
const Performance = require("../models/Dojo/PerformanceModel");
const admin = require("../config/firebase");

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
            return res.json({success: true, user, message: 'Login efetuado com sucesso' });
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
                email,
                type,
                birthDate: type === 'athlete' ? birthDate: null,
                responsavelId: responsavelId || null,
                childrens: type === 'responsavel' ? childrens : [],
                dojoId: dojoId || null,
                status: 'pending',
                emailVerified: false
            });
            
            return res.status(201).json({success: true, message: "Usuário criado com sucesso. Verifique seu e-mail.", user: newUser._id });
        } catch (err) {
            console.log(err);
            if (firebaseUser?.uid) {
                await admin.auth().deleteUser(firebaseUser.uid);
            }

            return res.status(500).json({success: false, message: "Erro ao criar o usuário", error: err.message });
        }
    },

    logout: async (res) => {
        res.clearCookie("auth", { httpOnly: true, secure: false, sameSite: "Lax" });
        return res.status(200).send({success: true, message: "Logout efetuado com sucesso" });
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

            const performance = new Performance({
                athlete: athleteId || null,
                childId: childId || null,
                rating,
                feedback: {
                    improvements,
                    needsImprovement
                }
            });
            await performance.save();

            res.json({ success: true, performance });
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

            res.json({ success: true, performance });
        } catch (err) {
        res.status(500).json({ success: false, error: err.message });
        }
    },

    addAbsence: async (req, res) => {
        try {
            const { userId, date } = req.body;

            const user = await Users.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: "User não encontrado" });
            }

            const absenceDate = new Date(date);
            const month = absenceDate.toISOString().slice(0, 7);

            const existingMonth = user.absences.find(a => a.month === month);

            if (existingMonth) {
                existingMonth.count += 1;
            } else {
                user.absences.push({ month, count: 1 });
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

            return res.json({ success: true, month, count: absence ? absence.count : 0 });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
};

module.exports = AuthController;