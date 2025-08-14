const UserModel = require('../model/user');

class UserController {
    static async createUser(req, res, next) {
        try {
            const data = req.body;

            const registerUser = await UserModel.createUser(data);

            res.status(201).json(registerUser)
        } catch (error) {
            next(error)
        }
    }

    static async login(req, res, next) {
        try {
            const data = req.body;

            const loginUser = await UserModel.login(data);

            res.status(200).json(loginUser)
        } catch (error) {
            next(error)
        }
    }

    static async getProfile(req, res, next) {
        try {
            const userId = req.user.id;

            if(!userId){
                throw new ApiError("User not found", 404);
            }
            const user = await UserModel.getProfile(userId);
            
            res.status(200).json({
              user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                nationality: user.nationality,
                dob: user.dob,
                phone: user.phone,
                department: user.department,
                position: user.position,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              },
            });
        } catch (error) {
            next(error)
        }
    }

    static async updateProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const data = req.body;
            const updatedUser = await UserModel.updateProfile(userId, data);

            res.status(200).json({
                user: {
                    id: updatedUser.id,
                    fullname: updatedUser.fullname,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    nationality: updatedUser.nationality,
                    phone: updatedUser.phone,
                    dob: updatedUser.dob,
                    department: updatedUser.department,
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.updatedAt,
                }
            });
        } catch (error) {
            next(error)
        }
    }

    static async getAllUser(req, res, next) {
        try {
            const users = await UserModel.getAllUser();
            res.status(200).json({
                success: true,
                data: users,
            });
        } catch (error) {
            next(error)
        }
    }

    static async deleteUser(req, res, next) {
        try {
            const userId = req.params.id;
            const deletedUser = await UserModel.deleteUser(parseInt(userId));
            res.status(200).json({
                message: deletedUser.message,
            });
        } catch (error) {
            next(error)
        }
    }
}


module.exports = UserController;