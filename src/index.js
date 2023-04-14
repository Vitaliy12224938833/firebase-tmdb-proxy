require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');

const apiKey = process.env.API_KEY;
app.use(cors());
// Прослушивание всех запросов, проходящих через прокси
app.all('/tmdb/*', async (req, res) => {
  const { method, headers, body } = req;
  const { mediaType, id, language, page } = req.query;

  if (!mediaType || !id) {
    res.status(400).json({ message: 'mediaType and listType are required' });
    return;
  }

  const apiUrl = `https://api.themoviedb.org/3/${mediaType}/${id}`;

  // Добавляем API ключ в параметры запроса

  const params = page
    ? new URLSearchParams({
        api_key: apiKey,
        language: language,
        page: page,
      })
    : new URLSearchParams({
        api_key: apiKey,
        language: language,
      });

  console.log(`${apiUrl}?${params.toString()}`);
  try {
    console.log();
    const response = await axios({
      method: method,
      url: `${apiUrl}?${params.toString()}`,
      data: body,
    });

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
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
