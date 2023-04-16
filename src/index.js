require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');
const Cache = require('node-cache');
const compression = require('compression');
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getStorage } = require('firebase/storage');
const { getFirestore } = require('firebase/firestore');
const {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} = require('firebase/auth');
const bodyParser = require('body-parser');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: 'react-auth-c6c13.firebaseapp.com',
  databaseURL: process.env.DATA_BASE_URL,
  projectId: 'react-auth-c6c13',
  storageBucket: 'react-auth-c6c13.appspot.com',
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.API_ID,
};

const apiKey = process.env.API_KEY;

const fireBaseApp = initializeApp(firebaseConfig);
const auth = getAuth(fireBaseApp);
const storage = getStorage(fireBaseApp);
const db = getFirestore(fireBaseApp);

app.use(cors());
app.use(compression());
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
const cache = new Cache({ stdTTL: 300, checkperiod: 600 });

app.get('/auth-on', async (req, res) => {
  const listen = onAuthStateChanged(auth, (user) => {
    if (user) {
      const { uid } = user;
      res.send({ success: true, uid });
    } else {
      res.send(false);
    }
  });
  listen();
});

app.post('/sign-up', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    res.send({ success: true, userCredential });
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: error.message });
  }
});

app.get('/sign-out', async (req, res) => {
  const message = 'sign out successful';
  try {
    signOut(auth);
    res.send({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: error.message });
  }
});

app.post('/sign-in', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log({ userCredential });
    const { operationType } = userCredential;

    res.send({ success: true, operationType });
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: error.message });
  }
});

app.get('/tmdb/*', async (req, res) => {
  const { method, body } = req;
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
});

app.use((err, res) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
