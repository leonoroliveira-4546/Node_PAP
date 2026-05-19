const express = require("express");
const axios = require("axios");

const router = express.Router();

const API_KEY = process.env.YOUTUBE_API_KEY;

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const cache = {
  videos: { data: null, timestamp: null },
  lives: { data: null, timestamp: null }
};

function isCacheValid(category) {
  const cached = cache[category];
  if (!cached.data || !cached.timestamp) return false;
  return Date.now() - cached.timestamp < CACHE_DURATION;
}

function getFromCache(category) {
  if (isCacheValid(category)) {
    console.log(`Retornando ${category} do cache`);
    return cache[category].data;
  }
  return null;
}

function setCache(category, data) {
  cache[category] = {
    data,
    timestamp: Date.now()
  };
}

// =========================
// Buscar CHANNEL ID
// =========================

async function getChannelId(handle) {

  const response = await axios.get(
    "https://www.googleapis.com/youtube/v3/search",
    {
      params: {
        key: API_KEY,
        part: "snippet",
        q: handle,
        type: "channel",
        maxResults: 1
      }
    }
  );

  return response.data.items[0]?.snippet?.channelId;
}

router.get("/fnk/videos", async (req, res) => {
  try {
    const cached = getFromCache('videos');
    if (cached) {
      return res.json(cached);
    }

    const maxResults = req.query.maxResults || 10;
    const channelId = await getChannelId("FNK Portugal");

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          key: API_KEY,
          part: "snippet",
          channelId: channelId,
          maxResults: maxResults,
          order: "date",
          type: "video"
        }
      }
    );

    const videoIds = response.data.items.map(video => video.id.videoId).filter(Boolean);
    const detailsResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          key: API_KEY,
          part: "contentDetails",
          id: videoIds.join(",")
        }
      }
    );

    const durationById = detailsResponse.data.items.reduce((acc, item) => {
      acc[item.id] = item.contentDetails.duration;
      return acc;
    }, {});

    const videos = response.data.items.map(video => ({
      videoId: video.id.videoId,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.high.url,
      publishedAt: video.snippet.publishedAt,
      duration: durationById[video.id.videoId] || 'PT0S'
    }));

    setCache('videos', videos);
    res.json(videos);
  } catch (error) {
    res.status(500).json({error: "Erro ao buscar vídeos"});
  }
});

router.get("/fnk/lives", async (req, res) => {
  try {
    const cached = getFromCache('lives');
    if (cached) {
      return res.json(cached);
    }

    const maxResults = req.query.maxResults || 5;
    const channelId = await getChannelId("FNK Portugal");

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          key: API_KEY,
          part: "snippet",
          channelId: channelId,
          eventType: "live",
          type: "video",
          maxResults: maxResults
        }
      }
    );

    const videoIds = response.data.items.map(video => video.id.videoId).filter(Boolean);
    const detailsResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          key: API_KEY,
          part: "contentDetails",
          id: videoIds.join(",")
        }
      }
    );

    const durationById = detailsResponse.data.items.reduce((acc, item) => {
      acc[item.id] = item.contentDetails.duration;
      return acc;
    }, {});

    const lives = response.data.items.map(video => ({
      videoId: video.id.videoId,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.high.url,
      publishedAt: video.snippet.publishedAt,
      duration: durationById[video.id.videoId] || 'PT0S'
    }));

    setCache('lives', lives);
    res.json(lives);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar lives" });
  }

});


module.exports = router;