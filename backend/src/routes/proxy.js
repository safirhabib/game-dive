const express = require('express');
const axios = require('axios');
const router = express.Router();

// Proxy route for external images
router.get('/image/:url(*)', async (req, res) => {
  try {
    const imageUrl = decodeURIComponent(req.params.url);
    
    // Make sure the URL is from a trusted domain
    if (!imageUrl.startsWith('https://gamecastlebd.com')) {
      return res.status(400).json({ error: 'Invalid image URL' });
    }

    // Fetch the image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    });

    // Set appropriate headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Content-Type', response.headers['content-type']);
    
    // Send the image
    res.send(response.data);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

module.exports = router;
