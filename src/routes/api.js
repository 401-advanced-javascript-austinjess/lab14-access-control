const auth = require('../auth/middleware');

const express = require('express');

const router = (module.exports = new express.Router());
const User = require('../auth/users-model');

// WHY DOESNT THIS ONE USE AN AUTH() METHOD??
router.post('/signup', (req, res, next) => {
  let user = new User(req.body);
  user
    .save()
    .then((user) => {
      req.user = user;
      req.token = user.generateToken();
      res.set('token', req.token);
      res.cookie('auth', req.token);
      res.send(req.token);
    })
    .catch(next);
});

router.post('/signin', auth('read'), (req, res, next) => {
  console.log('RES: ', res);
  console.log('REQ: ', req);
  res.cookie('auth', req.token);
  res.send(req.token);
});

// visible by anyone
router.get('/public-stuff', (req, res) => {
  res.send('Anyone can see this!');
});

// require only a valid login
router.get('/hidden-stuff', auth('user'), (req, res) => {
  res.send('Must be logged in to see this!');
});

// require the read capability
router.get('/something-to-read', auth('editor'), (req, res) => {
  res.send('Must have the READ capability!');
});

// require the create capability
router.post('/create-a-thing', auth('editor'), (req, res) => {
  res.send('Must have the CREATE capability');
});

// require the update capability
router.put('/update', auth('editor'), (req, res) => {
  res.send('Must have the UPDATE capability!');
});

// require the update capability
router.patch('/jp', auth('editor'), (req, res) => {
  res.send('Must have the UPDATE capability!');
});

// require the delete capability
router.delete('/bye-bye', auth('admin'), (req, res) => {
  res.send('Must have the DELETE capability!');
});

// require the superuser capability
router.get('/everything', auth('superuser'), (req, res) => {
  res.send('Must be a SUPERUSER!');
});
