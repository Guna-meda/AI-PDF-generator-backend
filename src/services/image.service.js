const axios = require('axios');

const getImage = async (query) => {
  console.log("Fetching image:", query);
  try {
    const res = await axios.get(
      'https://api.unsplash.com/search/photos',
      {
        params: {
          query,
          per_page: 1,
          orientation: 'landscape'
        },
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_KEY}`
        }
      }
    );

    console.log("Image fetched");
    return res.data.results[0]?.urls?.regular || 
           res.data.results[0]?.urls?.small || 
           res.data.results[0]?.urls?.thumb || '';
  } catch {
    console.log("Image failed");
    return '';
  }
};

module.exports = { getImage };