'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const Role = require('./roles-model.js');

const SINGLE_USE_TOKENS = !!process.env.SINGLE_USE_TOKENS;
const SECRET = process.env.SECRET || 'foobar';

const users = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String },
    role: {
      type: String,
      required: true,
      default: 'user',
      enum: ['admin', 'editor', 'user'],
    },
    // role: { type: mongoose.Types.ObjectId, ref: Role.schema },
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

// WHAT IS THIS DOING??
users.virtual('acl', {
  ref: 'roles',
  localField: 'role',
  foreignField: 'role',
  justOne: true,
});

users.pre('findOne', function() {
  this.populate('acl');
});

users.pre('save', function(next) {
  bcrypt
    .hash(this.password, 10)
    .then((hashedPassword) => {
      this.password = hashedPassword;
      next();
    })
    .catch((error) => {
      throw new Error(error);
    });
});

users.statics.createFromOauth = function(email) {
  if (!email) {
    return Promise.reject('Validation Error');
  }

  return this.findOne({ email })
    .then((user) => {
      if (!user) {
        throw new Error('User Not Found');
      }
      return user;
    })
    .catch((error) => {
      let username = email;
      let password = 'none';
      return this.create({ username, password, email });
    });
};

users.statics.authenticateToken = async function(token) {
  try {
    let parsedToken = jwt.verify(token, SECRET);
    // console.log('PARSED: ', parsedToken);
    // SINGLE_USE_TOKENS && parsedToken.type !== 'key' && usedTokens.add(token);
    let query = { _id: parsedToken.id };
    return this.findOne(query);
  } catch (e) {
    throw new Error('Invalid Token');
  }
};

users.statics.authenticateBasic = function(auth) {
  let query = { username: auth.username };
  return this.findOne(query)
    .then((user) => user && user.comparePassword(auth.password))
    .catch((error) => {
      throw error;
    });
};

users.methods.comparePassword = function(password) {
  return bcrypt
    .compare(password, this.password)
    .then((valid) => (valid ? this : null));
};

users.methods.generateToken = function(type) {
  let token = {
    id: this._id,
    // capabilities: capabilities[this.role],
    capabilities: (this.acl && this.acl.capabilities) || [],
    type: type || 'user',
  };

  return jwt.sign(token, process.env.SECRET);
};

users.methods.can = function(capability) {
  if (!capability) return true;
  if (!this.acl || !this.acl.capabilities) return false;
  return this.acl.capabilities.includes(capability);
};

users.methods.generateKey = function() {
  return this.generateToken('key');
};

module.exports = mongoose.model('users', users);
