require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getStorage } = require('firebase/storage');
const { getFirestore } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: 'react-auth-c6c13.firebaseapp.com',
  databaseURL: process.env.DATA_BASE_URL,
  projectId: 'react-auth-c6c13',
  storageBucket: 'react-auth-c6c13.appspot.com',
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.API_ID,
};

const fireBaseApp = initializeApp(firebaseConfig);
const auth = getAuth(fireBaseApp);
const storage = getStorage(fireBaseApp);
const db = getFirestore(fireBaseApp);

module.exports = auth;
module.exports = storage;
module.exports = db;

const storageSaveImg = async (req, res) => {
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
};

const read = async (req, res) => {
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
};

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
