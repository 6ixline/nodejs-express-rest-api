const { DashboardService } = require('../../services');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const logger = require('../../config/logger');
// Get Dashbaord Stats
const getDashboardStats = async (req, res) => {
    try {
        // Delegate to the service layer
        const dashbaordStats = await DashboardService.getDashboardStats();
        
        return successResponse(res, 200, "Dashboard stats fetched successfully!", dashbaordStats);
    } catch (err) {
        logger.error(`Error fetching dashboard stats: ${err.message}`);
        return errorResponse(res, 500, `Error fetching stats`, err.message);
    }
};

module.exports ={
    getDashboardStats
}