require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');
const Cache = require('node-cache');
const compression = require('compression');
const {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} = require('firebase/auth');
const {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc,
  setDoc,
} = require('firebase/firestore');
const {
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require('firebase/storage');

const auth = require('./firebase');
const storage = require('./firebase');
const db = require('./firebase');

const bodyParser = require('body-parser');

const apiKey = process.env.API_KEY;

app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cache = new Cache({ stdTTL: 300, checkperiod: 600 });

app.post('/storage/save-img', async (req, res) => {
  const { userId, file } = req.body;
  try {
    const storageRef = ref(storage, `image/${userId}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        res.send({ success: true, progress });
      },
      (error) => {
        alert(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          update(userId, { avatar: downloadURL });
          res.send({ success: true, progress: 0 });
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: error.message });
  }
});

app.post('/firestore/read', async (req, res) => {
  const { userId } = req.body;
  try {
    const userCollection = collection(db, 'users');
    const userDoc = doc(userCollection, userId);
    const userSnapshot = await getDoc(userDoc);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      res.send({ success: true, userData });
    } else {
      res.send({ success: false, userData: null });
    }
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: error.message });
  }
});

app.post('/firestore/set', async (req, res) => {
  const { userId, personData } = req.body;

  const message = 'set data';
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, personData);
    res.send({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: error.message });
  }
});

app.post('/firestore/update', async (req, res) => {
  const { userId, personData } = req.body;
  const message = 'update data';
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, personData);
    res.send({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: error.message });
  }
});

app.post('/firestore/add', async (req, res) => {
  const { userId, personData } = req.body;
  const message = 'add data';
  try {
    const userDocRef = doc(db, 'users', userId);
    await addDoc(userDocRef, personData);
    res.send({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: error.message });
  }
});

app.post('/firestore/remove-from-global-list', async (req, res) => {
  const { userId, id, mediaType } = req.body;
  const message = 'remove from global list';
  try {
    const washingtonRef = doc(db, 'users', userId);
    await updateDoc(washingtonRef, {
      [`allMedia.${id}`]: { bool: false, mediaType: mediaType, id: id },
    });
    res.send({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: error.message });
  }
});

app.post('/firestore/save-in-global-list', async (req, res) => {
  const { userId, id, mediaType } = req.body;
  const message = 'save in globl list';
  try {
    const washingtonRef = doc(db, 'users', userId);
    await updateDoc(washingtonRef, {
      [`allMedia.${id}`]: { bool: true, mediaType: mediaType, id: id },
    });
    res.send({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: error.message });
  }
});

app.post('/firestore/remove-from-list', async (req, res) => {
  const { userId, id, category, mediaType } = req.body;
  const message = 'remove from list';
  try {
    const washingtonRef = doc(db, 'users', userId);
    await updateDoc(washingtonRef, {
      [`mediaList.${mediaType}.${category}.${id}`]: false,
    });
    res.send({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: error.message });
  }
});

app.post('/firestore/save-in-list', async (req, res) => {
  const { userId, id, category, mediaType } = req.body;
  const message = 'remove from list';
  try {
    const washingtonRef = doc(db, 'users', userId);
    console.log(washingtonRef);
    await updateDoc(washingtonRef, {
      [`mediaList.${mediaType}.${category}.${id}`]: true,
    });
    res.send({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: error.message });
  }
});

app.get('/auth-on', async (req, res) => {
  try {
    const listen = onAuthStateChanged(auth, (user) => {
      if (user) {
        const { uid } = user;
        res.send({ success: true, uid });
      } else {
        res.send({ success: false, uid: null });
      }
    });
    listen();
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: error.message });
  }
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
    res.send({ success: false, message: error.message });
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

//module.exports = app;
