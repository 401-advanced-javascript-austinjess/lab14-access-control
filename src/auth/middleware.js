'use strict';

const User = require('./users-model.js');

module.exports = (capability) => {
  return (req, res, next) => {
    try {
      let [authType, authString] = req.headers.authorization.split(/\s+/);

      switch (authType.toLowerCase()) {
      case 'basic':
        return _authBasic(authString);
      case 'bearer':
        return _authBearer(authString);
      default:
        return _authError();
      }
    } catch (e) {
      _authError();
    }

    function _authBasic(str) {
      // str: am9objpqb2hubnk=
      let base64Buffer = Buffer.from(str, 'base64'); // <Buffer 01 02 ...>
      let bufferString = base64Buffer.toString(); // john:mysecret
      let [username, password] = bufferString.split(':'); // john='john'; mysecret='mysecret']
      let auth = { username, password }; // { username:'john', password:'mysecret' }

      return User.authenticateBasic(auth)
        .then((user) => _authenticate(user))
        .catch(_authError);
    }

    // function _authBearer(authString) {
    //   return User.authenticateToken(authString)
    //     .then((user) => _authenticate(user))
    //     .catch(_authError);
    // }

    async function _authBearer(token) {
      let user = await User.authenticateToken(token);
      await _authenticate(user);
    }

    // function _authenticate(user) {
    //   console.log('USER: ', user);
    //   console.log('CAPABILITY: ', capability);
    //   if (user && (capability || user.can(capability))) {
    //     console.log('FINALLY HITTING THIS!!!!!!!!!!!!!!!');
    //     req.user = user;
    //     req.token = user.generateToken();
    //     next();
    //   } else {
    //     _authError();
    //   }
    // }

    async function _authenticate(user) {
      if (!user) {
        return _authError();
      }
      if (!user.can(capability)) {
        return _authError();
      }
      req.user = user;
      req.token = user.generateToken();
      next();
    }

    function _authError() {
      next({
        status: 401,
        statusMessage: 'Unauthorized',
        message: 'Invalid Username/Password',
      });
    }
  };
};
