const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
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
        description: 'Get download info for a specific video URL. Now returns a direct video stream without redirect.'
      },
      {
        path: '/api/sdownload?q={query}',
        method: 'GET',
        description: 'Combined search and download: Searches for videos, takes a random result\'s link, and fetches direct download stream.'
      },
      {
        path: '/api/health',
        method: 'GET',
        description: 'Health check endpoint. Returns server status.'
      }
    ],
    version: '1.0.0',
    note: 'All endpoints handle errors and return JSON. Use responsibly and comply with Pornhub\'s TOS.'
  });
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required', api_creator: 'Minatocode' });
    }

    console.log(`[Search] Query: ${query}`);
    const searchUrl = `https://min-ph-search.onrender.com/api/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`Search API error: ${response.status} ${response.statusText}`);
    }
    const results = await response.json();
    console.log(`[Search] Raw response: ${JSON.stringify(results).slice(0, 200)}...`);

    const searchResults = Array.isArray(results) ? results : results.results || [];
    if (!searchResults.length) {
      return res.status(404).json({ error: 'No search results found', api_creator: 'Minatocode' });
    }

    const watermarkedResults = { results: searchResults, api_creator: 'Minatocode' };
    res.json(watermarkedResults);
  } catch (error) {
    console.error('[Search] Error:', error.message);
    res.status(500).json({ error: `Internal server error during search: ${error.message}`, api_creator: 'Minatocode' });
  }
});

// Download endpoint: now direct download without redirect
app.get('/api/download', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter "url" is required' });
    }

    console.log(`[Download] URL: ${url}`);
    const downloadUrl = `https://min-cornhub-dl.onrender.com/api/download?pUrl=${encodeURIComponent(url)}`;
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Download API error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');

    if (contentType && contentType.startsWith('video/')) {
      res.set({
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition || 'attachment; filename="video.mp4"'
      });
      response.body.pipe(res);
    } else {
      const downloadInfo = await response.json();
      res.json(downloadInfo);
    }
  } catch (error) {
    console.error('[Download] Error:', error.message);
    res.status(500).json({ error: `Internal server error during download: ${error.message}` });
  }
});

// Combined search + download endpoint (direct download)
app.get('/api/sdownload', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    console.log(`[SDownload] Query: ${query}`);
    const searchUrl = `https://min-ph-search.onrender.com/api/search?q=${encodeURIComponent(query)}`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`Search API error: ${searchResponse.status} ${searchResponse.statusText}`);
    }
    const searchResults = await searchResponse.json();
    console.log(`[SDownload] Search response: ${JSON.stringify(searchResults).slice(0, 200)}...`);

    const resultsArray = Array.isArray(searchResults) ? searchResults : searchResults.results || [];
    if (!resultsArray.length) {
      return res.status(404).json({ error: 'No search results found' });
    }

    const validResults = resultsArray.filter(result => result && typeof result.link === 'string' && result.link);
    if (!validResults.length) {
      return res.status(404).json({ error: 'No valid results with links found' });
    }

    const randomIndex = Math.floor(Math.random() * validResults.length);
    const randomLink = validResults[randomIndex].link;
    console.log(`[SDownload] Selected link: ${randomLink} (index: ${randomIndex})`);

    const downloadUrl = `https://min-cornhub-dl.onrender.com/api/download?pUrl=${encodeURIComponent(randomLink)}`;
    const downloadResponse = await fetch(downloadUrl);
    if (!downloadResponse.ok) {
      throw new Error(`Download API error: ${downloadResponse.status} ${downloadResponse.statusText}`);
    }

    const contentType = downloadResponse.headers.get('content-type');
    const contentDisposition = downloadResponse.headers.get('content-disposition');

    if (contentType && contentType.startsWith('video/')) {
      res.set({
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition || 'attachment; filename="video.mp4"',
        'X-Selected-Index': randomIndex.toString(),
        'X-Selected-Title': validResults[randomIndex].title || 'Unknown title'
      });
      downloadResponse.body.pipe(res);
    } else {
      const downloadInfo = await downloadResponse.json();
      downloadInfo.selected_index = randomIndex;
      downloadInfo.selected_title = validResults[randomIndex].title || 'Unknown title';
      res.json(downloadInfo);
    }
  } catch (error) {
    console.error('[SDownload] Error:', error.message);
    res.status(500).json({ error: `Internal server error during combined search and download: ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Endpoints: /, /api/search?q=, /api/download?url=, /api/sdownload?q=, /api/health`);
});
                                                                        
