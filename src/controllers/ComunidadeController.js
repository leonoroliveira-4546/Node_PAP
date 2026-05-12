const Comunidade = require('../models/Comunidade/ComunidadeModel');
const Comentario = require('../models/Comunidade/CommentsModel');
const News = require('../models/Comunidade/NewsModel');
const { uploadToCloudinary } = require('../middlewares/upload');
const mongoose = require('mongoose');

const ComunidadeController = {
    getNews: async (req, res) => {
        try {
            const news = await News.find().sort({ createdAt: -1 })
                .populate('author', 'username profilePic')
                .populate({
                    path: 'comments',
                    populate: {
                        path: 'author',
                        select: 'username profilePic'
                    }
                });
            res.json({ success: true, data: news });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Erro ao buscar notícias.' });
        }
    },

    createNews: async (req, res) => {
        try {
            const userType = req.user?.type;
            // if (userType !== 'admin') {
            //     return res.status(403).json({ success: false, message: 'Apenas administradores podem criar notícias.' });
            // }

            const { title, content, link } = req.body;
            if (!title || !content) {
                return res.status(400).json({ success: false, message: 'Título e conteúdo são obrigatórios.' });
            }

            let imagens = [];
            if (req.file) {
                console.log('Uploading image...');
                const uploaded = await uploadToCloudinary(req.file.buffer);
                console.log('Uploaded:', uploaded);
                imagens.push(uploaded.url);
            }

            const newsItem = new News({
                title,
                content,
                link,
                author: req.user._id,
                imagens
            });
            await newsItem.save();

            const populatedNews = await News.findById(newsItem._id)
                .populate('author', 'username profilePic');

            res.status(201).json({ success: true, data: populatedNews });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Erro ao criar notícia.' });
        }
    },

    likeNews: async (req, res) => {
        try {
            const newsId = req.params.id;
            const userId = req.user._id;

            const newsItem = await News.findById(newsId);
            if (!newsItem) {
                return res.status(404).json({ success: false, message: 'Notícia não encontrada.' });
            }

            const isLiked = newsItem.likes.includes(userId);
            if (isLiked) {
                newsItem.likes.pull(userId);
            } else {
                newsItem.likes.push(userId);
            }

            await newsItem.save();
            res.json({ success: true, likes: newsItem.likes.length });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Erro ao curtir notícia.' });
        }
    },

    addCommentToNews: async (req, res) => {
        try {
            const { message } = req.body;
            const newsId = req.params.id;
            const userId = req.user?._id;

            if (!message) {
                return res.status(400).json({ success: false, message: 'Mensagem obrigatória.' });
            }

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
            }

            const newComment = new Comentario({
                message,
                author: userId
            });
            await newComment.save();

            await News.findByIdAndUpdate(newsId, {
                $push: { comments: newComment._id }
            });

            const populatedComment = await Comentario.findById(newComment._id)
                .populate('author', 'username profilePic');

            res.json({ success: true, comment: populatedComment });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Erro ao adicionar comentário.' });
        }
    },

    removeCommentFromNews: async (req, res) => {
        try {
            const commentId = req.params.commentId;
            const deleted = await Comentario.findByIdAndDelete(commentId);

            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Comentário não encontrado.' });
            }

            res.status(200).json({ success: true, message: 'Comentário removido com sucesso.' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao remover comentário.' });
        }
    },

    getPosts: async (req, res) => {
        try {
            const { community = 'geral' } = req.query;
            const posts = await Comunidade.find({ community })
                .populate('author', 'username profilePic')
                .populate({
                    path: 'comments',
                    populate: {
                        path: 'author',
                        select: 'username profilePic'
                    }
                })
                .sort({ createdAt: -1 });

            res.json({ success: true, data: posts });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Erro ao buscar posts.' });
        }
    },

    createPost: async (req, res) => {
        try {
            let { title, message, community = 'geral' } = req.body;
            const userId = req.user._id;

            if (!userId) {
                return res.status(400).json({ success: false, message: 'Usuário obrigatório' });
            }

            let imagens = [];
            if (req.file) {
                const uploaded = await uploadToCloudinary(req.file.buffer);
                imagens.push(uploaded.url);
            }

            const newPost = new Comunidade({
                title,
                message,
                author: userId,
                imagens: imagens,
                community
            });
            await newPost.save();

            const populatedPost = await Comunidade.findById(newPost._id)
                .populate('author', 'username');

            res.json({ success: true, post: populatedPost });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Erro ao salvar post.' });
        }
    },

    getPostDetails: async (req, res) => {
        const { id } = req.params;

        try {
            const post = await Comunidade.findById(id)
                .populate('author', 'username profilePic')
                .populate({
                    path: 'comments',
                    populate: {
                        path: 'author',
                        select: 'username profilePic'
                    }
                });

            if (!post) {
                return res.status(404).json({ success: false, error: 'Post não encontrado.' });
            }

            res.json({ success: true, post });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Erro no servidor.' });
        }
    },

    deletePost: async (req, res) => {
        const postId = req.params.id;

        if (!postId) {
            return res.status(400).json({ success: false, message: 'ID não fornecido.' });
        }

        try {

            const result = await Comunidade.findByIdAndDelete(postId);
            if (!result) {
                return res.status(404).json({ success: false, message: 'Post não encontrada.' });
            }

            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Erro ao excluir a post.' });
        }
    },

    updatePost: async (req, res) => {
        const { title, message, imagens } = req.body;
        const postId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ success: false, message: 'ID inválido.' });
        }

        try {
            const post = await Comunidade.findById(postId);

            if (!post) {
                return res.status(404).json({ success: false, message: 'Post não encontrado.' });
            }

            post.title = title || post.title;
            post.message = message || post.message;

            if (imagens) {
                post.imagens = typeof imagens === 'string' ? [imagens] : imagens;
            }

            if (req.file) {
                const uploaded = await uploadToCloudinary(req.file.buffer);
                post.imagens = [...post.imagens, uploaded.url];
            }

            await post.save();

            res.json({ success: true, post });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Erro ao atualizar post.' });
        }
    },

    addComment: async (req, res) => {
        try {
            const { message, parentCommentId } = req.body;
            const postId = req.params.id;
            const userId = req.user?._id;

            if (!message) {
                return res.status(400).json({ success: false, message: 'Mensagem obrigatória.' });
            }

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
            }

            const newComment = new Comentario({
                message,
                post: postId,
                author: userId
            });
            await newComment.save();

            if (parentCommentId) {
                await Comentario.findByIdAndUpdate(parentCommentId, {
                    $push: { replies: newComment._id }
                });
            } else {
                await Comunidade.findByIdAndUpdate(postId, {
                    $push: { comments: newComment._id }
                });
            }

            const populatedComment = await Comentario.findById(newComment._id)
                .populate('author', 'username profilePic')

            res.json({ success: true, comment: populatedComment });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Erro ao adicionar o comentário.' });
        }
    },

    removeComment: async (req, res) => {
        try {
            const commentId = req.params.id;
            const deleted = await Comentario.findByIdAndDelete(commentId);

            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Comentário não encontrado.' });
            }

            res.status(200).json({ success: true, message: 'Comentário removido com sucesso.' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao remover comentário.' });
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
                return res.status(404).json({ success: false, message: 'Comentário não encontrado.' });
            }

            res.status(200).json({ success: true, updated });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao editar comentário.' });
        }
    }
};

module.exports = ComunidadeController;