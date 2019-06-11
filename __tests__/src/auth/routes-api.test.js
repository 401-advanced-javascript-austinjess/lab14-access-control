'use strict';

process.env.SECRET = 'test';

const server = require('../../../src/app.js').server;
const supergoose = require('../../supergoose.js');

const mockRequest = supergoose.server(server);

const Role = require('../../../src/auth/roles-model');
const User = require('../../../src/auth/users-model');

let roles = [
  { role: 'superuser', capabilities: ['read', 'update', 'create', 'delete'] },
  { role: 'admin', capabilities: ['read', 'update', 'create', 'delete'] },
  { role: 'editor', capabilities: ['read', 'update', 'create'] },
  { role: 'user', capabilities: ['read'] },
];

let users = {
  superuser: new User({
    username: 'superuser',
    password: 'password',
    role: 'superuser',
  }),
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
    it('returns 401 if not authenticated', async () => {
      return mockRequest.post('/create-a-thing').expect(401);
    });
    it('returns 200 if create capability is present', async () => {
      return mockRequest
        .post('/create-a-thing')
        .set('Authorization', `Bearer ${users.editor.generateToken()}`)
        .expect(200);
    });
  });

  describe('/update', () => {
    it('returns 401 if not authenticated', async () => {
      return mockRequest.put('/update').expect(401);
    });
    it('returns 200 if update capability is present', async () => {
      return mockRequest
        .put('/update')
        .set('Authorization', `Bearer ${users.editor.generateToken()}`)
        .expect(200);
    });
  });

  describe('/jp', () => {
    it('returns 401 if not authenticated', async () => {
      return mockRequest.patch('/jp').expect(401);
    });
    it('returns 200 if update capability is present', async () => {
      return mockRequest
        .patch('/jp')
        .set('Authorization', `Bearer ${users.admin.generateToken()}`)
        .expect(200);
    });
  });

  describe('/bye-bye', () => {
    it('returns 401 if not authenticated', async () => {
      return mockRequest.delete('/bye-bye').expect(401);
    });
    it('returns 200 if delete capability is present', async () => {
      return mockRequest
        .delete('/bye-bye')
        .set('Authorization', `Bearer ${users.admin.generateToken()}`);
    });
  });

  describe('/everything', () => {
    it('returns 401 if not authenticated', async () => {
      return (
        mockRequest
          .get('/everything')
          // .set('Authorization', `Bearer ${users.editor.generateToken()}`)
          .expect(401)
      );
    });
    it('returns 200 if superuser capability is present', async () => {
      return mockRequest
        .get('/everything')
        .set('Authorization', `Bearer ${users.superuser.generateToken()}`)
        .expect(200);
    });
  });
});
