const bcrypt = require("bcrypt");
const prisma = require("../helpers/prisma");
const ApiError = require('../helpers/apiError');
const jwt = require('jsonwebtoken');

class UserModel {
    static async createUser(data) {
        const isEmailExist = await prisma.user.findUnique({
          where: {
            email: data.email,
          },
        });

        if (isEmailExist) {
          throw new ApiError("Email already exist", 409);
        }

        if (data.password.length < 8) {
          throw new ApiError("Password must be at least 8 characters", 400);
        }

        if (data.password !== data.confirmPassword) {
          throw new ApiError(
            "Password and confirm password must be the same",
            400
          );
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const registerData = {
          email: data.email,
          password: hashedPassword,
          fullname: data.fullname,
          dob: data.dob ? new Date(data.dob) : null,
          nationality: data.nationality,
          phone: data.phone,
          role: 'employee',
          department: data.department,
          position: data.position,
        };

        const registered = await prisma.user.create({
            data: registerData
        });

        return registered;
    }

    static async login(data) {
        const user = await prisma.user.findUnique({
            where: {
                email: data.email
            }
        });

        if (!user) {
            throw new ApiError("Email/password invalid", 404);
        }

        const isPasswordMatch = await bcrypt.compare(data.password, user.password);
        if (!isPasswordMatch) {
            throw new ApiError("Email/password invalid", 401);

        }

        const token = jwt.sign({
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            department: user.department,
            position: user.position
        }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        return {
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                department: user.department,
                position: user.position
            },
        }
    }

    static async getProfile(id) {
        const user = await prisma.user.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            fullname: true,
            email: true,
            role: true,
            nationality: true,
            phone: true,
            dob: true,
            department: true,
            position: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if(!user){
            throw new ApiError("User not found", 404);

        }

        return user;
    }

    static async updateProfile(id, data) {
        const user = await prisma.user.findUnique({
            where: {
                id,
            },
        });

        if(!user){
            throw new ApiError("User not found", 404);
        }

        const updateData = {
          fullname: data.fullname,
          dob: data.dob ? new Date(data.dob) : user.dob,
          nationality: data.nationality || user.nationality,
          phone: data.phone || user.phone,
          role: data.role,
          department: data.department || user.department,
          position: data.position || user.position,
        };

        const updatedUser = await prisma.user.update({
            where: {
                id,
            },
            data: updateData,
        });

        return updatedUser;
    }

    static async getAllUser() {
        const users = await prisma.user.findMany({
            where: {
                role: 'employee'
            },
            select: {
                id: true,
                fullname: true,
                email: true,
                role: true,
                nationality: true,
                phone: true,
                dob: true,
                department: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        return users;   
    }

    static async deleteUser(id) {
        const user = await prisma.user.findUnique({
            where: {
                id,
            },
        });

        if(!user){
            throw new ApiError("User not found", 404);
        }

        await prisma.user.delete({
            where: {
                id,
            },
        });

        return {
            message: "User deleted successfully",
        }
    }
}

module.exports = UserModel;
