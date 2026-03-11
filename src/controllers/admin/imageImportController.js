const ImageImportService = require('../../services/imageImportService');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const logger = require('../../config/logger');

// Check which products have missing images
const checkMissingImages = async (req, res) => {
  try {
    const results = await ImageImportService.checkMissingImages();

    return successResponse(res, 200, 'Image check completed', results);

  } catch (err) {
    logger.error(`Image check failed: ${err.message}`);
    return errorResponse(res, 500, 'Image check failed', err.message);
  }
};

// Download missing images report as Excel
const downloadMissingImagesReport = async (req, res) => {
  try {
    const workbook = await ImageImportService.generateMissingImagesReport();

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Disposition', 'attachment; filename=missing_images_report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    return res.send(buffer);

  } catch (err) {
    logger.error(`Missing images report download failed: ${err.message}`);
    return errorResponse(res, 500, 'Report download failed', err.message);
  }
};

// Download Product images report as Excel
const downloadProductImagesReport = async (req, res) => {
  try {
    const workbook = await ImageImportService.generateProductImagesReport();

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Disposition', 'attachment; filename=product_images_report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    return res.send(buffer);

  } catch (err) {
    logger.error(`Missing images report download failed: ${err.message}`);
    return errorResponse(res, 500, 'Report download failed', err.message);
  }
};

// Bulk upload images for all products
const bulkUploadImages = async (req, res) => {
  try {
    const { overwrite = false } = req.body;
    const createdBy = req.user.id;

    logger.info(`Starting bulk image upload by admin ${createdBy}`);

    const results = await ImageImportService.bulkUploadProductImages(
      createdBy,
      overwrite
    );

    const message = `Bulk image upload completed: ${results.uploaded.length} uploaded, ${results.skipped.length} skipped, ${results.missing.length} missing`;
    
    return successResponse(res, 200, message, results);

  } catch (err) {
    logger.error(`Bulk image upload failed: ${err.message}`);
    return errorResponse(res, 500, 'Bulk image upload failed', err.message);
  }
};

// Upload images for specific product codes
const uploadSpecificImages = async (req, res) => {
  try {
    const { productCodes, overwrite = false } = req.body;
    const createdBy = req.user.id;

    if (!productCodes || !Array.isArray(productCodes) || productCodes.length === 0) {
      return errorResponse(res, 400, 'Product codes array is required');
    }

    logger.info(`Uploading images for ${productCodes.length} products`);

    const results = await ImageImportService.uploadImagesForProducts(
      productCodes,
      createdBy,
      overwrite
    );

    const uploadedCount = results.uploaded.filter(r => r.status === 'success').length;
    const message = `Image upload completed: ${uploadedCount} uploaded, ${results.missing.length} missing, ${results.notFound.length} not found`;
    
    return successResponse(res, 200, message, results);

  } catch (err) {
    logger.error(`Image upload failed: ${err.message}`);
    return errorResponse(res, 500, 'Image upload failed', err.message);
  }
};

module.exports = {
  checkMissingImages,
  downloadMissingImagesReport,
  bulkUploadImages,
  downloadProductImagesReport,
  uploadSpecificImages
};