'use strict';

process.env.SECRET = 'test';

const jwt = require('jsonwebtoken');

const server = require('../../../src/app.js').server;
const supergoose = require('../../supergoose.js');

const mockRequest = supergoose.server(server);

const Role = require('../../../src/auth/roles-model');
let roles = [
  { role: 'admin', capabilities: ['read', 'write', 'add', 'delete'] },
  { role: 'editor', capabilities: ['read', 'write', 'add'] },
  { role: 'user', capabilities: ['read'] },
];
let users = {
  admin: { username: 'admin', password: 'password', role: 'admin' },
  editor: { username: 'editor', password: 'password', role: 'editor' },
  user: { username: 'user', password: 'password', role: 'user' },
};

beforeAll(async () => {
  await supergoose.startDB();
  await Promise.all(
    Object.values(roles).map(role => {
      return new Role(role).save();
    })
  );
});

afterAll(supergoose.stopDB);

describe('Auth Router', () => {
  Object.keys(users).forEach((userType) => {
    describe(`${userType} users`, () => {
      let encodedToken;
      let id;

      it('can create one', () => {
        return mockRequest
          .post('/signup')
          .send(users[userType])
          .expect(200)
          .then((results) => {
            var token = jwt.verify(results.text, process.env.SECRET);
            id = token.id;
            encodedToken = results.text;
            expect(token.id).toBeDefined();
            expect(token.capabilities).toBeDefined();
          });
      });

      it('can signin with basic', () => {
        return mockRequest
          .post('/signin')
          .auth(users[userType].username, users[userType].password)
          .then((results) => {
            //console.log('RESULTS: ', results.text);
            var token = jwt.verify(results.text, process.env.SECRET);
            expect(token.id).toEqual(id);
            expect(token.capabilities).toBeDefined();
          });
      });

      it('can signin with bearer', () => {
        return mockRequest
          .post('/signin')
          .set('Authorization', `Bearer ${encodedToken}`)
          .then((results) => {
            //console.log(results);
            var token = jwt.verify(results.text, process.env.SECRET);
            expect(token.id).toEqual(id);
            expect(token.capabilities).toBeDefined();
          });
      });
    });
  });
});
