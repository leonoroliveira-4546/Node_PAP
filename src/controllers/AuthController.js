const Users = require("../models/UsersModel");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const jwtkey = 'jkdoamnwpa';

const AuthController = {
    login: async (req, res) => {
        const { email, password } = req.body;

        try {
            const user = await Users.findOne({ email: email.toLowerCase() });

            if (!user) {
                return res.status(400).send("User não encontrado");
            }

            if (user && (await bcrypt.compare(password, user.password))) {
                const token = jwt.sign(
                    {
                        user_id: user._id.toString(),
                        email: user.email

                    },
                    jwtkey,
                    {
                        expiresIn: "30d"
                    }
                );
                const userObj = user.toObject();
                userObj.token = token;

                res.cookie("auth", token, { httpOnly: true, secure: false, sameSite: "Lax" });
                return res.json(userObj);
            } else {
                return res.status(400).send("Password Incorreta");
            }
        } catch (err) {
            return res.status(400).send(err);
        }
    },

    register: async (req, res) => {
        const { username, email, password } = req.body;

        try {
            const existingUserByEmail = await Users.findOne({ email });
            if (existingUserByEmail) {
                return res.status(400).json({ message: "Já existe um usuário com esse email." });
            }

            const existingUserByUsername = await Users.findOne({ username });
            if (existingUserByUsername) {
                return res.status(400).json({ message: "Já existe um usuário com esse username." });
            }

            const plano = await Planos.findOne({ title: "Free" });
            if (!plano) {
                return res.status(400).json({ message: "Não há plano que exista" });
            }

            const encrypted_pass = await bcrypt.hash(password, 10);
            const newUser = await Users.create({
                username,
                email,
                password: encrypted_pass,
                type: "Cliente",
                pontos: 0,
                ativo: 0,
                subtype: "Normal",
                planos: plano,
                Lv: 0,
                Xp: {
                    falta: 100,
                    tenho: 0,
                },
                pontuaçao: {
                    quiz: 0,
                    memoria: 0
                },
                title: "Explorador Novato",
                profilePic: "https://feppv-marineer-bucket.s3.eu-central-1.amazonaws.com/aws-1746803776536-68379383.png",
            });

            // Gerar token de verificação
            const token = jwt.sign({ user_id: newUser._id }, jwtkey, { expiresIn: "1h" });

            // Enviar email de verificação
            await sendVerificationEmail(newUser, token);
            res.status(201).json({ message: "Usuário criado com sucesso. Verifique seu e-mail.", user: newUser });
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Erro ao criar o usuário", error: err });
        }
    },

    logout: async (res) => {
        res.clearCookie("auth");
        res.status(200).send({ message: "Logout Successful" })
    }
};

module.exports = AuthController;