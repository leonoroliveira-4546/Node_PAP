const Dojos = require('../models/Dojo/DojosModel');
const Tournament = require('../models/Dojo/TournamentModel');
const Prediction = require('../models/Features/PredictionModel');
const Users = require('../models/UsersModel');

const planCatalog = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'gratuito',
    description: 'Perfeito para começar',
    color: 'medium',
    features: [
      'Comunidade básica',
      'Chat com outros membros',
      'Calendário de treinos',
      'Predições limitadas',
      'Acesso a notícias',
    ],
  },
  {
    id: 'economico',
    name: 'Econômico',
    price: 9.99,
    period: 'mês',
    description: 'Para karatecas dedicados',
    color: 'primary',
    features: [
      'Tudo do plano Free',
      'IA básica para treinos',
      'Relatórios simples de progresso',
      'Descontos na loja (10%)',
      'Predições ilimitadas',
      'Acesso prioritário ao chat',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    period: 'mês',
    description: 'Experiência completa',
    color: 'warning',
    popular: true,
    features: [
      'Tudo do plano Econômico',
      'Conteúdo educacional completo',
      'Relatórios detalhados de progresso',
      'Descontos na loja (25%)',
      'Acesso a lives e eventos exclusivos',
      'Suporte prioritário',
      'Certificados de participação',
      'Mentoria personalizada',
    ],
  },
];

const shopProducts = [
  {
    id: '1',
    name: 'Kimono Shureido WKF Approved',
    description: 'Kimono de competição aprovado pela WKF, tecido premium 100% algodão japonês.',
    price: 349.9,
    category: 'Kimono',
    image: 'https://loremflickr.com/400/300/karate,kimono?lock=1',
    rating: 5,
    reviewCount: 42,
    inStock: true,
    badge: 'Mais Vendido',
  },
  {
    id: '4',
    name: 'Protetor de Mão WKF',
    description: 'Luvas de competição aprovadas pela WKF, espuma de alta densidade.',
    price: 89.9,
    category: 'Equipamento',
    image: 'https://loremflickr.com/400/300/boxing,gloves?lock=4',
    rating: 5,
    reviewCount: 31,
    inStock: true,
    badge: 'Novo',
  },
  {
    id: '8',
    name: 'Faixa Preta Dan - Seda',
    description: 'Faixa preta em seda bordada com nome e graduação a escolher.',
    price: 79.9,
    category: 'Faixa',
    image: 'https://loremflickr.com/400/300/karate,belt,black?lock=8',
    rating: 5,
    reviewCount: 54,
    inStock: true,
    badge: 'Mais Vendido',
  },
  {
    id: '11',
    name: 'Bolsa de Equipamentos Karate',
    description: 'Bolsa esportiva com compartimento para kimono e acessórios, 50L.',
    price: 149.9,
    originalPrice: 179.9,
    category: 'Acessório',
    image: 'https://loremflickr.com/400/300/sports,bag,gym?lock=11',
    rating: 5,
    reviewCount: 16,
    inStock: true,
    badge: 'Promoção',
  },
];

const educationalVideos = [
  {
    id: '1',
    title: 'A História do Karatê - Das Origens à Modernidade',
    description: 'Uma jornada completa pelas raízes do karatê, desde Okinawa até os dias atuais.',
    thumbnail: 'https://loremflickr.com/320/180/karate,history?lock=1',
    channelName: 'Karate Academy',
    channelAvatar: 'https://ui-avatars.com/api/?name=Karate+Academy&background=random&size=40',
    duration: '15:30',
    views: 12500,
    publishedAt: '2024-03-15T10:00:00Z',
    category: 'historia',
    url: 'https://youtube.com/watch?v=example1',
  },
  {
    id: '2',
    title: 'Filosofia do Karatê-Dô - O Caminho do Karateca',
    description: 'Explorando os princípios filosóficos que guiam a prática do karatê.',
    thumbnail: 'https://loremflickr.com/320/180/karate,philosophy?lock=2',
    channelName: 'Sensei Talks',
    channelAvatar: 'https://ui-avatars.com/api/?name=Sensei+Talks&background=random&size=40',
    duration: '22:45',
    views: 8900,
    publishedAt: '2024-03-20T14:30:00Z',
    category: 'filosofia',
    url: 'https://youtube.com/watch?v=example2',
  },
  {
    id: '3',
    title: 'Técnicas Fundamentais - Kihon no Kata',
    description: 'Aprenda os movimentos básicos do karatê com demonstrações passo a passo.',
    thumbnail: 'https://loremflickr.com/320/180/karate,techniques?lock=3',
    channelName: 'Karate Techniques',
    channelAvatar: 'https://ui-avatars.com/api/?name=Karate+Techniques&background=random&size=40',
    duration: '18:20',
    views: 15600,
    publishedAt: '2024-03-25T09:15:00Z',
    category: 'tecnicas',
    url: 'https://youtube.com/watch?v=example3',
  },
];

const formatParticipants = async (dojoId) => {
  if (!dojoId) return [];

  const dojo = await Dojos.findById(dojoId).populate('members', 'username profilePic belt');
  if (!dojo) return [];

  return dojo.members.slice(0, 8).map((member) => ({
    id: member._id.toString(),
    name: member.username,
    avatar:
      member.profilePic ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(member.username)}&background=random&size=100`,
    belt: member.belt || 'Branca',
  }));
};

const FeaturesController = {
  getPlans: async (req, res) => {
    try {
      return res.json({ success: true, data: planCatalog, currentPlan: req.user.currentPlan || 'free' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  getCurrentPlan: async (req, res) => {
    try {
      const plan = req.user.currentPlan || 'free';
      return res.json({ success: true, currentPlan: plan });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  subscribePlan: async (req, res) => {
    try {
      const { planId } = req.body;
      const exists = planCatalog.find((p) => p.id === planId);
      if (!exists) {
        return res.status(400).json({ success: false, message: 'Plano inválido' });
      }

      const user = await Users.findByIdAndUpdate(
        req.user._id,
        { $set: { currentPlan: planId } },
        { new: true }
      );

      return res.json({ success: true, currentPlan: user.currentPlan, message: 'Plano atualizado com sucesso' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  getPredictionTournaments: async (req, res) => {
    try {
      const tournaments = await Tournament.find(
        req.user.dojoId ? { dojo: req.user.dojoId } : {}
      ).sort({ date: 1 });

      const participants = await formatParticipants(req.user.dojoId);

      const data = tournaments.map((tournament) => ({
        id: tournament._id.toString(),
        name: tournament.name,
        date: tournament.date,
        location: tournament.location,
        status: tournament.status || 'open',
        winner: tournament.winner || undefined,
        participants,
      }));

      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  getMyPredictions: async (req, res) => {
    try {
      const predictions = await Prediction.find({ userId: req.user._id }).sort({ createdAt: -1 });
      const data = predictions.map((p) => ({
        id: p._id.toString(),
        userId: p.userId.toString(),
        tournamentId: p.tournamentId.toString(),
        predictedWinner: p.predictedWinner,
        pointsEarned: p.pointsEarned,
        timestamp: p.createdAt,
      }));

      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  submitPrediction: async (req, res) => {
    try {
      const { tournamentId, predictedWinner } = req.body;
      if (!tournamentId || !predictedWinner) {
        return res.status(400).json({ success: false, message: 'tournamentId e predictedWinner são obrigatórios' });
      }

      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({ success: false, message: 'Torneio não encontrado' });
      }
      if (tournament.status !== 'open') {
        return res.status(400).json({ success: false, message: 'Predições encerradas para este torneio' });
      }

      const prediction = await Prediction.findOneAndUpdate(
        { userId: req.user._id, tournamentId },
        { $set: { predictedWinner } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.json({
        success: true,
        prediction: {
          id: prediction._id.toString(),
          userId: prediction.userId.toString(),
          tournamentId: prediction.tournamentId.toString(),
          predictedWinner: prediction.predictedWinner,
          pointsEarned: prediction.pointsEarned,
          timestamp: prediction.createdAt,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  getShopProducts: async (req, res) => {
    try {
      return res.json({ success: true, data: shopProducts });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  getEducationalVideos: async (req, res) => {
    try {
      return res.json({ success: true, data: educationalVideos });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};

module.exports = FeaturesController;
