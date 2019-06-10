const supergoose = require('../../supergoose');

const User = require('../../../src/auth/users-model');
const Role = require('../../../src/auth/roles-model');

beforeAll(supergoose.startDB);
afterAll(supergoose.stopDB);

describe('The User Model', () => {
  describe('findOne', () => {
    it('populates acl', async () => {
      // ARRANGE
      await new User({
        username: 'k',
        password: 'd',
        role: 'editor',
      }).save();

      await new Role({ role: 'editor', capabilities: ['c', 'r', 'u'] }).save();

      // ACT
      let user = await User.findOne({ username: 'k' });
      console.log(user);

      // ASSERT
      expect(user).toBeDefined();
      expect(user.acl).toBeDefined();

      // Missing capability - assume all users allowed
      expect(user.can()).toBe(true);

      expect(user.can('c')).toBe(true);
      expect(user.can('r')).toBe(true);
      expect(user.can('u')).toBe(true);
      expect(user.can('d')).toBe(false);
    });
  });
});

// .auth('username', 'password');
// expect(401);
