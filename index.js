const express = require('express');
const axios = require('axios');
const pornhub = require('@justalk/pornhub-api');
const app = express();

// Root endpoint: API info
app.get('/', (req, res) => {
  res.json({
    api_creator: "MinatoCodes",
    endpoints: {
      "/api/search?q=": "Search Pornhub videos by keyword. Returns title, creator, and video URL.",
      "/api/download?q=": "Fetch download URL using video page URL (from search).",
      "/api/download?url=": "Fetch download URL using direct Pornhub video URL."
    }
  });
});

// /api/search?q=
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ success: false, error: 'Missing query', api_creator: "MinatoCodes" });
  }

  try {
    const results = await pornhub.search({ search: query, page: 1 });
    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, error: 'No results found', api_creator: "MinatoCodes" });
    }

    const video = results[0];
    res.json({
      success: true,
      creator: video.pornstars?.[0] || 'Unknown',
      url: video.url,
      api_creator: "MinatoCodes"
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, error: 'Internal server error', api_creator: "MinatoCodes" });
  }
});

// /api/download?q=  OR  /api/download?url=
app.get('/api/download', async (req, res) => {
  const videoUrl = req.query.q || req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ success: false, error: 'Missing video URL', api_creator: "MinatoCodes" });
  }

  try {
    const response = await axios.get(`https://min-cornhub-dl.vercel.app/api/download?pUrl=${encodeURIComponent(videoUrl)}`);
    const downloadUrl = response.data?.download_url;

    if (!downloadUrl) {
      return res.status(404).json({ success: false, error: 'Download URL not found', api_creator: "MinatoCodes" });
    }

    res.json({
      success: true,
      download_url: downloadUrl,
      api_creator: "MinatoCodes"
    });
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch download URL', api_creator: "MinatoCodes" });
  }
});

module.exports = app;
