const Comunidade = require('../models/Comunidade/ComunidadeModel');
const Comentario = require('../models/Comunidade/CommentsModel');
const { uploadToCloudinary } = require('../middlewares/upload');
const mongoose = require('mongoose');

const ComunidadeController = {
    getContents: async (req, res) => {
        try {
            const {type, community = 'geral'} = req.query;
            const filter = {};

            if (type) filter.type = type;
            if (community) filter.community = community;

            const contents = await Content.find(filter)
                .populate('author', 'username profilePic')
                .populate({
                    path: 'comments',
                    populate: {
                        path: 'author',
                        select: 'username profilePic'
                    }
                })
                .sort({ createdAt: -1 });

            res.json({ success: true, data: contents });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Erro ao buscar conteúdos.' });
        }
    },

    getContentDetails: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido.' });
            }

            const content = await Content.findById(id)
                .populate('author', 'username profilePic')
                .populate({
                    path: 'comments',
                    populate: {
                        path: 'author',
                        select: 'username profilePic'
                    }
                });

            if (!content) {
                return res.status(404).json({ success: false, message: 'Conteúdo não encontrado.' });
            }

            res.json({ success: true, content });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Erro ao buscar conteúdo.' });
        }
    },

    createContent: async (req, res) => {
        try {
            const { title, message, content, link, type = 'post', community = 'geral' } = req.body;
            const userId = req.user?._id;

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
            }
            if (!title) {
                return res.status(400).json({ success: false, message: 'Título obrigatório.' });
            }
            if ((type === 'news' || type === 'tournament') && req.user.type !== 'admin') {
                return res.status(403).json({ success: false, message: 'Apenas administradores podem criar notícias.'});
            }

            let imagens = [];
            if (req.file) {
                const uploaded = await uploadToCloudinary(req.file.buffer);
                imagens.push(uploaded.url);
            }

            const newContent = new Content({
                title,
                message,
                content,
                link,
                type,
                author: userId,
                imagens,
                community
            });
            await newContent.save();

            const populatedContent = await Content.findById(newContent._id)
                .populate('author', 'username profilePic');

            res.status(201).json({ success: true, content: populatedContent });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Erro ao criar conteúdo.' });
        }
    },

    likeContent: async (req, res) => {
        try {
            const contentId = req.params.id;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(contentId)) {
                return res.status(400).json({ success: false, message: 'ID inválido.' });
            }

            const content = await Content.findById(contentId);
            if (!content) {
                return res.status(404).json({ success: false, message: 'Conteúdo não encontrado.'});
            }

            const isLiked = content.likes.includes(userId);
            if (isLiked) {
                content.likes.pull(userId);
            } else {
                content.likes.push(userId);
            }

            await content.save();

            res.json({ success: true, likes: content.likes.length });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Erro ao curtir conteúdo.' });
        }
    },

    addComment: async (req, res) => {
        try {
            const { message, parentCommentId } = req.body;
            const contentId = req.params.id;
            const userId = req.user?._id;

            if (!mongoose.Types.ObjectId.isValid(contentId)) {
                return res.status(400).json({ success: false, message: 'ID inválido.' });
            }
            if (!message) {
                return res.status(400).json({ success: false, message: 'Mensagem obrigatória.' });
            }
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
            }

            const newComment = new Comentario({
                message,
                post: contentId,
                author: userId
            });
            await newComment.save();

            if (parentCommentId) {
                await Comentario.findByIdAndUpdate(parentCommentId, { $push: { replies: newComment._id } });
            } else {
                await Content.findByIdAndUpdate(contentId, { $push: { comments: newComment._id } });
            }

            const populatedComment = await Comentario.findById(newComment._id)
                .populate('author', 'username profilePic');

            res.json({ success: true, comment: populatedComment });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Erro ao adicionar comentário.' });
        }
    },

    editComment: async (req, res) => {
        try {
            const commentId = req.params.id;
            const { message } = req.body;

            const updated = await Comentario.findByIdAndUpdate(
                commentId,
                { message },
                { new: true }
            ).populate('author', 'username profilePic');

            if (!updated) {
                return res.status(404).json({ success: false, message: 'Comentário não encontrado.'});
            }

            res.json({ success: true, updated });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Erro ao editar comentário.' });
        }
    },

    removeComment: async (req, res) => {
        try {
            const commentId = req.params.id;

            const deleted = await Comentario.findByIdAndDelete(commentId);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Comentário não encontrado.' });
            }

            res.json({ success: true, message: 'Comentário removido com sucesso.' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Erro ao remover comentário.' });
        }
    },

    updateContent: async (req, res) => {
        try {
            const contentId = req.params.id;

            if (!mongoose.Types.ObjectId.isValid(contentId)) {
                return res.status(400).json({ success: false, message: 'ID inválido.' });
            }

            const {
                title,
                message,
                content,
                imagens,
                link,
                isImportant
            } = req.body;

            const existingContent = await Content.findById(contentId);
            if (!existingContent) {
                return res.status(404).json({ success: false, message: 'Conteúdo não encontrado.' });
            }

            existingContent.title = title || existingContent.title;
            existingContent.message = message || existingContent.message;
            existingContent.content = content || existingContent.content;
            existingContent.link = link || existingContent.link;

            if (typeof isImportant !== 'undefined') {
                existingContent.isImportant = isImportant;
            }

            if (imagens) {
                existingContent.imagens =
                    typeof imagens === 'string'
                        ? [imagens]
                        : imagens;
            }

            if (req.file) {
                const uploaded = await uploadToCloudinary(req.file.buffer);
                existingContent.imagens.push(uploaded.url);
            }

            await existingContent.save();

            res.json({ success: true, content: existingContent });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Erro ao atualizar conteúdo.' });
        }
    },

    deleteContent: async (req, res) => {
        try {
            const contentId = req.params.id;

            if (!mongoose.Types.ObjectId.isValid(contentId)) {
                return res.status(400).json({ success: false, message: 'ID inválido.' });
            }

            const deleted = await Content.findByIdAndDelete(contentId);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Conteúdo não encontrado.' });
            }

            res.json({ success: true, message: 'Conteúdo removido com sucesso.' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Erro ao remover conteúdo.'});
        }
    }
};

module.exports = ComunidadeController;