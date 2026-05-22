const Comunidade = require('../models/Comunidade/ComunidadeModel');
const Comentario = require('../models/Comunidade/CommentsModel');
const { uploadToCloudinary } = require('../middlewares/upload');
const mongoose = require('mongoose');

const ComunidadeController = {
    getContents: async (req, res) => {
        try {
            const {type, community = 'geral'} = req.query;
            const filter = {};
            const typeMap = {
                posts: 'post',
                post: 'post',
                news: 'news',
                tournament: 'tournament'
            };
            const requestedType = typeMap[type] || type;

            if (requestedType && requestedType !== '' && requestedType !== 'undefined') {
                filter.type = requestedType;
            }
            if (community && community !== '' && community !== 'undefined') {
                filter.community = community;
            }

            const contents = await Comunidade.find(filter)
                .populate('author', 'username profilePic')
                .populate({
                    path: 'comments',
                    populate: [
                        {
                            path: 'author',
                            select: 'username profilePic'
                        },
                        {
                            path: 'replies',
                            populate: {
                                path: 'author',
                                select: 'username profilePic'
                            }
                        }
                    ]
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

            const content = await Comunidade.findById(id)
                .populate('author', 'username profilePic')
                .populate({
                    path: 'comments',
                    populate: [
                        {
                            path: 'author',
                            select: 'username profilePic'
                        },
                        {
                            path: 'replies',
                            populate: {
                                path: 'author',
                                select: 'username profilePic'
                            }
                        }
                    ]
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
            const { title, message, content, link, type = 'post', community = 'geral', attachments, poll } = req.body;
            const userId = req.user?._id;

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
            }
            if (!title) {
                return res.status(400).json({ success: false, message: 'Título obrigatório.' });
            }

            let imagens = [];
            if (req.file) {
                const uploaded = await uploadToCloudinary(req.file.buffer);
                imagens.push(uploaded.url);
            }

            let attachmentsData = [];
            if (attachments) {
                try {
                    attachmentsData = typeof attachments === 'string' ? JSON.parse(attachments) : attachments;
                } catch (parseErr) {
                    attachmentsData = [];
                }
            }

            let pollData = null;
            if (poll) {
                try {
                    const parsedPoll = typeof poll === 'string' ? JSON.parse(poll) : poll;
                    if (parsedPoll.question && Array.isArray(parsedPoll.options)) {
                        pollData = {
                            question: parsedPoll.question,
                            options: parsedPoll.options.map((option) => ({ text: option.text || option, votes: option.votes || [] })),
                            createdBy: userId
                        };
                    }
                } catch (parseErr) {
                    pollData = null;
                }
            }

            const newContent = new Comunidade({
                title,
                message,
                content,
                link,
                type,
                author: userId,
                imagens,
                community,
                attachments: attachmentsData,
                poll: pollData
            });
            await newContent.save();

            const populatedContent = await Comunidade.findById(newContent._id)
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

            const content = await Comunidade.findById(contentId);
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

    votePoll: async (req, res) => {
        try {
            const contentId = req.params.id;
            const optionIndex = Number(req.params.optionIndex);
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(contentId)) {
                return res.status(400).json({ success: false, message: 'ID inválido.' });
            }

            const content = await Comunidade.findById(contentId);
            if (!content || !content.poll) {
                return res.status(404).json({ success: false, message: 'Enquete não encontrada.' });
            }

            const poll = content.poll;
            if (!poll.options || optionIndex < 0 || optionIndex >= poll.options.length) {
                return res.status(400).json({ success: false, message: 'Opção inválida.' });
            }

            poll.options.forEach((option) => {
                option.votes = option.votes.filter(voteId => voteId.toString() !== userId.toString());
            });

            const selectedOption = poll.options[optionIndex];
            if (!selectedOption.votes.includes(userId)) {
                selectedOption.votes.push(userId);
            }

            content.poll = poll;
            await content.save();

            res.json({ success: true, poll: content.poll });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Erro ao votar na enquete.' });
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
                await Comunidade.findByIdAndUpdate(contentId, { $push: { comments: newComment._id } });
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

            const { title, message, content, imagens, link, isImportant, attachments, poll } = req.body;

            const existingContent = await Comunidade.findById(contentId);
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

            if (attachments) {
                try {
                    const parsedAttachments = typeof attachments === 'string' ? JSON.parse(attachments) : attachments;
                    existingContent.attachments = Array.isArray(parsedAttachments) ? parsedAttachments : existingContent.attachments;
                } catch (parseErr) {
                    // ignore invalid attachments payload
                }
            }

            if (poll) {
                try {
                    const parsedPoll = typeof poll === 'string' ? JSON.parse(poll) : poll;
                    if (parsedPoll.question && Array.isArray(parsedPoll.options)) {
                        existingContent.poll = {
                            question: parsedPoll.question,
                            options: parsedPoll.options.map((option) => ({ text: option.text || option, votes: option.votes || [] })),
                            createdBy: existingContent.poll?.createdBy || req.user._id
                        };
                    }
                } catch (parseErr) {
                    // ignore invalid poll payload
                }
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

            const deleted = await Comunidade.findByIdAndDelete(contentId);
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