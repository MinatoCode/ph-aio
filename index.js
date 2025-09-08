const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies (if needed for future POST routes)
app.use(express.json());

// Root endpoint: Info about all endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Combined Pornhub API Proxy',
    endpoints: [
      {
        path: '/api/search?q={query}',
        method: 'GET',
        description: 'Search for videos using the query parameter. Returns array of video results with title, views, author, duration, link, hd, premium and api_creator watermark.'
      },
      {
        path: '/api/download?url={video_url}',
        method: 'GET',
        description: 'Get download info for a specific video URL. Returns download_url, ext, success, title, creator and api_creator watermark.'
      },
      {
        path: '/api/sdownload?q={query}',
        method: 'GET',
        description: 'Combined search and download: Searches for videos, takes a random result\'s link, and fetches download info. Returns the download response with api_creator watermark.'
      },
      {
        path: '/api/health',
        method: 'GET',
        description: 'Health check endpoint. Returns server status.'
      }
    ],
    version: '1.0.0',
    note: 'All endpoints handle errors and return JSON. Use responsibly and comply with Pornhub\'s TOS.',
    api_creator: 'Minatocode'
  });
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', api_creator: 'Minatocode' });
});

// Search endpoint: Proxy to external search API
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required', api_creator: 'Minatocode' });
    }

    const searchUrl = `https://min-ph-search.onrender.com/api/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }
    const results = await response.json();

    // Add watermark to search results
    const watermarkedResults = { ...results, api_creator: 'Minatocode' };

    res.json(watermarkedResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error during search', api_creator: 'Minatocode' });
  }
});

// Download endpoint: Proxy to external download API
app.get('/api/download', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter "url" is required', api_creator: 'Minatocode' });
    }

    const downloadUrl = `https://min-cornhub-dl.onrender.com?url=${encodeURIComponent(url)}`;
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }
    const downloadInfo = await response.json();

    // Add watermark to download response
    downloadInfo.api_creator = 'Minatocode';

    res.json(downloadInfo);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Internal server error during download', api_creator: 'Minatocode' });
  }
});

// Combined search + download endpoint
app.get('/api/sdownload', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required', api_creator: 'Minatocode' });
    }

    // Step 1: Search
    const searchUrl = `https://min-ph-search.onrender.com/api/search?q=${encodeURIComponent(query)}`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`Search API error: ${searchResponse.status}`);
    }
    const searchResults = await searchResponse.json();

    if (!searchResults || searchResults.length === 0) {
      return res.status(404).json({ error: 'No search results found', api_creator: 'Minatocode' });
    }

    // Pick a random result's link
    const randomIndex = Math.floor(Math.random() * searchResults.length);
    const randomLink = searchResults[randomIndex].link;

    // Step 2: Download with random link
    const downloadUrl = `https://min-cornhub-dl.onrender.com?url=${encodeURIComponent(randomLink)}`;
    const downloadResponse = await fetch(downloadUrl);
    if (!downloadResponse.ok) {
      throw new Error(`Download API error: ${downloadResponse.status}`);
    }
    const downloadInfo = await downloadResponse.json();

    // Add watermark and extra info to download response
    downloadInfo.api_creator = 'Minatocodes';
    downloadInfo.selected_index = randomIndex;
    downloadInfo.selected_title = searchResults[randomIndex].title;

    res.json(downloadInfo);
  } catch (error) {
    console.error('Sdownload error:', error);
    res.status(500).json({ error: 'Internal server error during combined search and download', api_creator: 'Minatocode' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Endpoints: /, /api/search?q=, /api/download?url=, /api/sdownload?q=, /api/health`);
});
