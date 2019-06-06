const auth = require('../auth/middleware');

const express = require('express');

const router = (module.exports = new express.Router());

// visible by anyone
router.get('/public-stuff', (req, res) => {
  res.send('Anyone can see this!');
});

// require only a valid login
router.get('/hidden-stuff', (req, res) => {
  res.send('Must be logged in to see this!');
});

// require the read capability
router.get('/something-to-read', (req, res) => {
  res.send('Must have the READ capability!');
});

// require the create capability
router.post('/create-a-thing', (req, res) => {
  res.send('Must have the CREATE capability');
});

// require the update capability
router.put('/update', (req, res) => {
  res.send('Must have the UPDATE capability!');
});

// require the update capability
router.patch('/jp', (req, res) => {
  res.send('Must have the UPDATE capability!');
});

// require the delete capability
router.delete('/bye-bye', (req, res) => {
  res.send('Must have the DELETE capability!');
});

// require the superuser capability
router.get('/everything', (req, res) => {
  res.send('Must be a SUPERUSER!');
});
