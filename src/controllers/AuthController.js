const sendVerificationEmail = require("../utils/sendVerificationEmail");
const Users = require("../models/UsersModel");
const admin = require("../config/firebase");
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const jwtkey = 'jkdoamnwpa';

const AuthController = {
    login: async (req, res) => {
        const { idToken } = req.body;

        try {
            //Verificar o token no Firebase
            const decoded = await admin.auth().verifyIdToken(idToken);
            const user = await Users.findOne({ authUid: decoded.uid })

            if (!user) {
                return res.status(404).json({message: 'Usuário não encontrado' });
            }

            if (!decoded.email_verified) {
                return res.status(403).json({message: 'Email não verificado. Verifique sua caixa de entrada.' });
            }

            if (!user.emailVerified) {
                user.emailVerified = true;
                user.status = 'active';
                await user.save();
            }

            res.cookie("auth", idToken, { httpOnly: true, secure: false, sameSite: "Lax" });
            return res.json({user, message: 'Login efetuado com sucesso' });
        } catch (err) {
            console.error(err);
            return res.status(401).json({message: 'Token inválido ou expirado'});
        }
    },

    register: async (req, res) => {
        const { username, email, password, type,  birthDate, dojoId, responsavelId} = req.body;

        try {
            const existingUserByEmail = await Users.findOne({ email });
            if (existingUserByEmail) {
                return res.status(400).json({ message: "Já existe um usuário com esse email." });
            }

            if (type === 'athlete' && !birthDate) {
                return res.status(400).json({ message: 'Por favor, preenche a data de nascimento.'})
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
                dojoId: dojoId || null,
                status: 'pending',
                emailVerified: false
            });
            
            return res.status(201).json({ message: "Usuário criado com sucesso. Verifique seu e-mail.", user: newUser._id });
        } catch (err) {
            console.log(err);

            if (err.uid) {
                await admin.auth().deleteUser(err.uid);
            }

            return res.status(500).json({ message: "Erro ao criar o usuário", error: err.message });
        }
    },

    logout: async (res) => {
        res.clearCookie("auth", idToken, { httpOnly: true, secure: false, sameSite: "Lax" });
        return res.status(200).send({ message: "Logout efetuado com sucesso" });
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

    sendEmail: async (req, res) => {
        const { username, email } = req.body;
    }
};

module.exports = AuthController;