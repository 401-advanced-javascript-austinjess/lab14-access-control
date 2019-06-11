'use strict';

process.env.SECRET = 'test';

const server = require('../../../src/app.js').server;
const supergoose = require('../../supergoose.js');

const mockRequest = supergoose.server(server);

const Role = require('../../../src/auth/roles-model');
const User = require('../../../src/auth/users-model');

let roles = [
  { role: 'admin', capabilities: ['read', 'update', 'create', 'delete'] },
  { role: 'editor', capabilities: ['read', 'update', 'create'] },
  { role: 'user', capabilities: ['read'] },
];

let users = {
  admin: new User({ username: 'admin', password: 'password', role: 'admin' }),
  editor: new User({ username: 'editor', password: 'password', role: 'admin' }),
  user: new User({ username: 'user', password: 'password', role: 'user' }),
};

beforeAll(async () => {
  await supergoose.startDB();
  await Promise.all(
    Object.values(roles).map((role) => {
      return new Role(role).save();
    })
  );

  await Promise.all(
    Object.values(users).map((user) => {
      return new User(user).save();
    })
  );
});

afterAll(supergoose.stopDB);

describe('The Protected Routes API', () => {
  let errorMessage = {
    status: 401,
    statusMessage: 'Unauthorized',
    message: 'You dont have permission to access',
  };

  it('allows for anyone to access the public route', async () => {
    return mockRequest.get('/public-stuff').expect(200);
  });

  describe('/something-to-read', () => {
    it('returns 401 if not authenticated', () => {
      return mockRequest.get('/something-to-read').expect(401);
    });

    it('returns 200 if read capability is present', async () => {
      // dont need this is stuff is already created in beforeAll
      // let role = await new Role({
      //   role: 'user',
      //   capabilities: ['read'],
      // }).save();
      // let normalUser = await new User({
      //   username: 'Keith',
      //   password: 'password',
      //   role: 'user',
      // }).save();

      // SETTING THE HEADERS NOW
      // .auth('Keith', 'password') - BASIC
      // .set('Authorication', `Bearer ${nonAdminUser.generateToken()}`)

      return mockRequest
        .get('/something-to-read')
        .set('Authorization', `Bearer ${users.admin.generateToken()}`)
        .expect(200);
    });
  });

  describe('/create-a-thing', () => {
    it('returns 401 if not authenticated', async () => {});
    it('returns 200 if create capability is present', async () => {});
  });

  describe('/update', () => {
    it('returns 401 if not authenticated', async () => {});
    it('returns 200 if update capability is present', async () => {});
  });

  describe('/jp', () => {
    it('returns 401 if not authenticated', async () => {});
    it('returns 200 if update capability is present', async () => {});
  });

  describe('/bye-bye', () => {
    it('returns 401 if not authenticated', async () => {});
    it('returns 200 if delete capability is present', async () => {});
  });

  describe('/everything', () => {
    it('returns 401 if not authenticated', async () => {});
    it('returns 200 if superuser capability is present', async () => {});
  });
});
