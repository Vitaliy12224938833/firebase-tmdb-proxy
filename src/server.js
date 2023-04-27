const express = require('express');
const app = express();
const cors = require('cors');
const compression = require('compression');
const tmdb = require('./tmdb');
const {
  fbAdd,
  fbAuthOn,
  fbRead,
  fbRemoveFromGlobalList,
  fbRemoveFromList,
  fbSaveInGlobalList,
  fbSaveInList,
  fbSet,
  fbSignIn,
  fbSignOut,
  fbSignUp,
  fbStorageSaveImg,
  fbUpdate,
} = require('./firebase');

const bodyParser = require('body-parser');

app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/storage/save-img', async (req, res) => fbStorageSaveImg(req, res));

app.post('/firestore/read', async (req, res) => fbRead(req, res));

app.post('/firestore/set', async (req, res) => fbSet(req, res));

app.post('/firestore/update', async (req, res) => fbUpdate(req, res));

app.post('/firestore/add', async (req, res) => fbAdd(req, res));

app.post('/firestore/remove-from-global-list', async (req, res) =>
  fbRemoveFromGlobalList(req, res)
);

app.post('/firestore/save-in-global-list', async (req, res) =>
  fbSaveInGlobalList(req, res)
);

app.post('/firestore/remove-from-list', async (req, res) =>
  fbRemoveFromList(req, res)
);

app.post('/firestore/save-in-list', async (req, res) => fbSaveInList(req, res));

app.get('/auth-on', async (req, res) => fbAuthOn(req, res));

app.post('/sign-up', async (req, res) => fbSignUp(req, res));

app.get('/sign-out', async (req, res) => fbSignOut(req, res));

app.post('/sign-in', async (req, res) => fbSignIn(req, res));

app.get('/tmdb/*', async (req, res) => tmdb(req, res));

app.use((err, res) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});

module.exports = app;
