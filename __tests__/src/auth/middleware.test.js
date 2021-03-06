'use strict';

process.env.SECRET = 'test';

const jwt = require('jsonwebtoken');

const { startDB, stopDB } = require('../../supergoose.js');
const auth = require('../../../src/auth/middleware.js');
const Users = require('../../../src/auth/users-model.js');
const Role = require('../../../src/auth/roles-model');

let users = {
  admin: { username: 'admin', password: 'password', role: 'admin' },
  editor: { username: 'editor', password: 'password', role: 'editor' },
  user: { username: 'user', password: 'password', role: 'user' },
};

beforeAll(async () => {
  await startDB();
  await new Users(users.admin).save();
  await new Users(users.editor).save();
  await new Users(users.user).save();
  await new Role({
    role: 'admin',
    capabilities: ['create', 'read', 'update', 'delete'],
  }).save();
});

afterAll(stopDB);

/*
  For now, these test only make assertions on the admin user
  That user has a role with create, read, update, delete credentials
  ... you can go further as you please.
 */
describe('Auth Middleware', () => {
  // admin:password: YWRtaW46cGFzc3dvcmQ=
  // admin:foo: YWRtaW46Zm9v
  // editor:password: ZWRpdG9yOnBhc3N3b3Jk
  // user:password: dXNlcjpwYXNzd29yZA==

  let errorMessage = {
    status: 401,
    statusMessage: 'Unauthorized',
    message: 'Invalid Username/Password',
  };

  describe('user authentication', () => {
    let cachedToken;

    it('fails a login for a user (admin) with the incorrect basic credentials', () => {
      let req = {
        headers: {
          authorization: 'Basic YWRtaW46Zm9v',
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth();

      return middleware(req, res, next).then(() => {
        expect(next).toHaveBeenCalledWith(errorMessage);
      });
    }); // it()

    it('fails a login for a user (admin) with an incorrect bearer token', () => {
      const token = jwt.sign('5cf9d2fa24225793e5d5f89d', process.env.SECRET);
      let req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth();

      middleware(req, res, next).then(() => {
        expect(next).toHaveBeenCalledWith(errorMessage);
      });
    }); // it()

    it('logs in an admin user with the right credentials', () => {
      let req = {
        headers: {
          authorization: 'Basic YWRtaW46cGFzc3dvcmQ=',
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth('delete');

      return middleware(req, res, next).then(() => {
        cachedToken = req.token;
        expect(next).toHaveBeenCalledWith();
      });
    }); // it()

    // this test borrows the token gotten from the previous it() ... not great practice
    // but we're using an in-memory db instance, so we need a way to get the user ID
    // and token from a "good" login, and the previous passing test does provide that ...
    it('logs in an admin user with a correct bearer token', () => {
      let req = {
        headers: {
          authorization: `Bearer ${cachedToken}`,
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth();

      return middleware(req, res, next).then(() => {
        expect(next).toHaveBeenCalledWith();
      });
    }); // it()
  });

  describe('user authorization', () => {
    it('restricts access to a valid user without permissions', () => {}); // it()

    it('grants access when a user has permission', () => {}); // it()
  }); // describe()
});
