require('dotenv').config();

const axios = require('axios');
const Cache = require('node-cache');
const apiKey = process.env.API_KEY;
const cache = new Cache({ stdTTL: 300, checkperiod: 600 });
const tmdb = async (req, res) => {
  const { method } = req;
  const { mediaType, id, language, page, dataType, seasonNum, query } =
    req.query;

  if (!mediaType || !id) {
    res.status(400).json({ message: 'mediaType and listType are required' });
    return;
  }

  const season = seasonNum ? `/season/${seasonNum}` : '';
  const defaultDataType = dataType ? `/${dataType}` : '';
  const apiUrl = `https://api.themoviedb.org/3/${mediaType}/${id}${season}${defaultDataType}`;

  const params = page
    ? new URLSearchParams({
        api_key: apiKey,
        language: language,
        page: page,
        query: query,
      })
    : new URLSearchParams({
        api_key: apiKey,
        language: language,
      });

  const cacheKey = `${apiUrl}?${params.toString()}`;

  // проверяем наличие данных в кэше
  const cachedResponse = cache.get(cacheKey);

  if (cachedResponse) {
    // если данные есть в кэше, отправляем их клиенту
    console.log(`Serving cached response for ${cacheKey}`);
    res.json(cachedResponse);
    return;
  }

  try {
    console.log(`Fetching response for ${cacheKey}`);
    const response = await axios({
      method: method,
      url: `${apiUrl}?${params.toString()}`,
    });

    // сохраняем данные в кэше
    cache.set(cacheKey, response.data);

    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      res.status(status).json(data);
    } else if (error.request) {
      res.status(500).json({ message: 'API request failed' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = tmdb;
