const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Não autorizado.' });
    }

    if (req.user.type !== 'admin') {
        return res.status(403).json({ success: false, message: 'Acesso restrito a administradores.' });
    }

    next();
};

module.exports = verifyAdmin;
