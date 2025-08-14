const UserRouter = require('express').Router();
const UserController = require('../controllers/user');
const authFunction = require('../middlewares/Authentication');

UserRouter.post('/register', UserController.createUser);
UserRouter.post('/login', UserController.login);
UserRouter.get('/profile', authFunction.authentication, UserController.getProfile);
UserRouter.put('/profile', authFunction.authentication, UserController.updateProfile);
UserRouter.get('/all', authFunction.authentication, authFunction.authorization('admin'), UserController.getAllUser);
UserRouter.delete('/:id', authFunction.authentication, authFunction.authorization('admin'), UserController.deleteUser);

module.exports = UserRouter;
