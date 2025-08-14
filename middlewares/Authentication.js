const ApiError = require('../helpers/apiError');
const prisma = require('../helpers/prisma');
const jwt = require('jsonwebtoken');

const authentication = async (req, res, next) => {
    try {
        const { accesstoken } = req.headers;

        if (!accesstoken) {
            throw new ApiError('token not found!', 404);
        }

        const decoded = jwt.verify(accesstoken, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            },
            select: {
                id: true,
                fullname: true,
                department: true,
                email: true,
                role: true
            }
        });

        if(!user){
            throw new ApiError("user not found!", 404);
        }

        req.user = {
            id: user.id,
            fullname: user.fullname,
            department: user.department,
            email: user.email,
            role: user.role
        }
        next();

    } catch (error) {
        next(error)
    }
}

const authorization = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError("Authentication required!", 401);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ApiError(
          "You are not authorized to access this resource!",
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

const ROLES = {
  EMPLOYEE: "employee",
  ADMIN: "admin",
};

const authFunction = {
    authentication,
    authorization,
    ROLES,
}

module.exports = authFunction;