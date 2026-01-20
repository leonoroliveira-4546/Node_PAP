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
        const { username, email, password, type,  birthDate, dojoId, responsavelId} = req.body;

        function calculateAge(birthDate) {
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const month = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        }

        try {
            const existingUserByEmail = await Users.findOne({ email });
            if (existingUserByEmail) {
                return res.status(400).json({ message: "Já existe um usuário com esse email." });
            }

            if (type === 'athlete') {
                if (!birthDate) {
                    return res.status(400).json({ message: 'Por favor, preenche a data de nascimento.'})
                }

                const age = calculateAge(birthDate);

                if (age < 13) {
                    return res.status(403).json({ message: 'Atletas com menos de 13 anos devem ser cadastrados por um responsável.'})
                }

                if (age < 18 && !responsavelId) {
                    return res.status(400).json({ message: 'Atletas de 13 a 17 anos precisam de um responsável'})
                }
            }

            const encrypted_pass = await bcrypt.hash(password, 10);
            const newUser = await Users.create({
                username,
                email,
                password: encrypted_pass
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