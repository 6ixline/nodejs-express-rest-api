const { BulkImportService } = require('../../services');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const logger = require('../../config/logger');
const fs = require('fs').promises;

/**
 * Bulk import products from Excel
 */
const bulkImportProducts = async (req, res) => {
  let filePath;
  
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'No Excel file uploaded');
    }

    filePath = req.file.path;
    const createdBy = req.user.id;

    // Validate Excel structure first (AWAIT added here!)
    const validation = await BulkImportService.validateExcelStructure(filePath);
    
    if (!validation.valid) {
      // Delete uploaded file
      await fs.unlink(filePath);
      return errorResponse(res, 400, validation.message);
    }

    logger.info(`Starting bulk import: ${validation.rowCount} rows by admin ${createdBy}`);

    // Process bulk import
    const results = await BulkImportService.bulkImportProducts(filePath, createdBy);

    // Delete uploaded file after processing
    try {
      await fs.unlink(filePath);
    } catch (unlinkErr) {
      logger.warn(`Could not delete temp file: ${unlinkErr.message}`);
    }

    // Determine response status
    if (results.failed === results.total) {
      return errorResponse(res, 500, 'All products failed to import', results);
    }

    const message = `Bulk import completed: ${results.created} created, ${results.updated} updated, ${results.failed} failed`;
    
    return successResponse(res, 200, message, results);

  } catch (err) {
    // Clean up file on error
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (unlinkErr) {
        logger.error(`Error deleting file: ${unlinkErr.message}`);
      }
    }
    
    logger.error(`Bulk import failed: ${err.message}`);
    return errorResponse(res, 500, 'Bulk import failed', err.message);
  }
};

/**
 * Validate Excel file without importing
 */
const validateExcelFile = async (req, res) => {
  let filePath;
  
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'No Excel file uploaded');
    }

    filePath = req.file.path;

    // AWAIT added here!
    const validation = await BulkImportService.validateExcelStructure(filePath);

    // Delete uploaded file
    await fs.unlink(filePath);

    if (!validation.valid) {
      return errorResponse(res, 400, validation.message);
    }

    return successResponse(res, 200, 'Excel file is valid', {
      rowCount: validation.rowCount,
      message: validation.message
    });

  } catch (err) {
    // Clean up file on error
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (unlinkErr) {
        logger.error(`Error deleting file: ${unlinkErr.message}`);
      }
    }
    
    logger.error(`Excel validation failed: ${err.message}`);
    return errorResponse(res, 500, 'Excel validation failed', err.message);
  }
};

/**
 * Download Excel template
 */
const downloadExcelTemplate = async (req, res) => {
  try {
    const workbook = await BulkImportService.generateExcelTemplate();

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=product_import_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    return res.send(buffer);

  } catch (err) {
    logger.error(`Template download failed: ${err.message}`);
    return errorResponse(res, 500, 'Template download failed', err.message);
  }
};

const bulkImportKeywords = async (req, res) => {
  let filePath;

  try {
    if (!req.file) {
      return errorResponse(res, 400, 'No Excel file uploaded');
    }

    filePath = req.file.path;
    const updatedBy = req.user.id;

    logger.info(`Starting keyword import by admin ${updatedBy}`);

    const results = await BulkImportService.bulkImportKeywords(filePath, updatedBy);

    try {
      await fs.unlink(filePath);
    } catch (unlinkErr) {
      logger.warn(`Could not delete temp file: ${unlinkErr.message}`);
    }

    if (results.failed === results.total) {
      return errorResponse(res, 500, 'All rows failed to import keywords', results);
    }

    const message = `Keyword import completed: ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`;
    return successResponse(res, 200, message, results);

  } catch (err) {
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (unlinkErr) {
        logger.error(`Error deleting file: ${unlinkErr.message}`);
      }
    }

    logger.error(`Keyword import failed: ${err.message}`);
    return errorResponse(res, 500, 'Keyword import failed', err.message);
  }
};

module.exports = {
  bulkImportProducts,
  validateExcelFile,
  downloadExcelTemplate,
  bulkImportKeywords
};