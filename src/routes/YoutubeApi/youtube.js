const express = require("express");
const axios = require("axios");

const router = express.Router();

const API_KEY = process.env.YOUTUBE_API_KEY;


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

    res.json(videos);

  } catch (error) {

    console.log(error.response?.data || error.message);

    res.status(500).json({
      error: "Erro ao buscar vídeos"
    });

  }

});

router.get("/fnk/lives", async (req, res) => {

  try {
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

    res.json(lives);

  } catch (error) {

    console.log(error.response?.data || error.message);

    res.status(500).json({
      error: "Erro ao buscar lives"
    });

  }

});


module.exports = router;