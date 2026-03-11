const { Op } = require('sequelize');
const { AdminService } = require('../../services');
const { generateAdminAccessToken, verifyAdminRefreshToken, generateAdminRefreshToken } = require('../../config/jwt');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const RefreshToken = require('../../models/refreshToken');
const { Admin } = require('../../models');
const logger = require('../../config/logger');

// Admin login route
const loginAdmin = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Delegate to service layer for authentication
        const admin = await AdminService.loginAdmin(username, password);

        const token = generateAdminAccessToken(admin);

        const refresh_token = generateAdminRefreshToken(admin);

        // Set HttpOnly cookie with the token
        res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
        path: '/', 
        });

        // Set HttpOnly cookie with the token
        res.cookie('admin_refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
        path: '/', 
        });

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

        await RefreshToken.create({
        token: refresh_token,
        type: 'admin',
        adminId: admin.id,
        expiresAt,
        });

        // Log successful login
        logger.info(`Admin ${username} logged in successfully`);

        // Send success response
        return successResponse(res, 200, `logged in successfully`, { admin });
    } catch (err) {
        logger.error(`Login failed for admin ${username}: ${err.message}`);
        return errorResponse(res, 500, `Login failed for admin ${username}`, err.message);
    }
};

// Get the access Token Details
const accessTokenDetails = async (req, res) => {
    try {
        // Delegate to the service layer
        const id = req.user.id;
        const admin = await Admin.findByPk(id);
        
        return successResponse(res, 200, `Account fetched successfully`, admin);
    } catch (err) {
        logger.error(`Error creating admin: ${err.message}`);
        return errorResponse(res, 500, `Error creating admin`, err.message);
    }
};

const refreshAdminToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.admin_refresh_token;

        if (!refreshToken) {
        return errorResponse(res, 401, 'No refresh token provided');
        }

        const decoded = verifyAdminRefreshToken(refreshToken);

        const tokenRecord = await RefreshToken.findOne({
        where: {
            token: refreshToken,
            adminId: decoded.id,
            type: 'admin',
            expiresAt: { [Op.gt]: new Date() },
        },
        });

        if (!tokenRecord) {
        return errorResponse(res, 403, "Invalid or expired refresh token");
        }

        // Rotate refresh token
        await tokenRecord.destroy();

        const newAccessToken = generateAdminAccessToken({ id: decoded.id, type: 'admin', role: decoded.role });
        const newRefreshToken = generateAdminRefreshToken({ id: decoded.id, type: 'admin', role: decoded.role });

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

        await RefreshToken.create({
            token: newRefreshToken,
            type: 'admin',
            adminId: decoded.id,
            expiresAt,
        });

        res.cookie('admin_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000,
        });
        res.cookie('admin_refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000,
        });

        return  successResponse(res, 200, 'Token Refreshed successfully!', { accessToken: newAccessToken });
    } catch (err) {
        return errorResponse(res, 401, 'Unauthorized', err.message);
    }
};


const changePassword = async (req, res) => {
    try {
        const id = req.user.id;
        const {oldpassword, newpassword} = req.body;
        const admin = await AdminService.changePassword(id, oldpassword, newpassword);

        logger.info(`Admin ${admin.username} password is changed successfully`);
        return successResponse(res, 200, 'Password changed successfully');
    } catch (err) {
        logger.error(`Error password changing: ${err.message}`);
        return errorResponse(res, 500, 'Password change failed!', err.message);
    }
};

const logoutAdmin = async (req, res) => {
    try {
        res.cookie('admin_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(0), // expire immediately
            path: '/',
            sameSite: 'lax',
        });

        res.cookie('admin_refresh_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(0), // expire immediately
            path: '/',
            sameSite: 'lax',
        });

        await RefreshToken.destroy({ where: { token: req.cookies.admin_refresh_token } });
        res.clearCookie('admin_refresh_token');

        logger.info(`Admin logged out successfully`);

        return successResponse(res, 200, 'Logged out successfully');
    } catch (err) {
        logger.error(`Logout failed: ${err.message}`);
        return errorResponse(res, 500, 'Logout failed', err.message);
    }
};

// Create a new admin user (for super admin purposes)
const createAdmin = async (req, res) => {
    const { username, displayName, password } = req.body;

    try {
        // Delegate to the service layer
        const admin = await AdminService.createAdmin(username, displayName, password);
        
        // Log the creation of a new admin
        logger.info(`Admin ${username} created successfully`);
        
        return successResponse(res, 200, `Admin ${username} created successfully`, admin);
    } catch (err) {
        logger.error(`Error creating admin: ${err.message}`);
        return errorResponse(res, 500, `Error creating admin`, err.message);
    }
};

module.exports = {
    accessTokenDetails,
    createAdmin,
    loginAdmin,
    refreshAdminToken,
    logoutAdmin,
    changePassword,
}