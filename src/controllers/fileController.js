const logger = require('../config/logger');
const FileService = require('../services/fileService');
const { errorResponse, successResponse } = require('../utils/apiResponse');

const singleFileUpload = async (req, res) => {
  try {
    const { ownerType } = req.params;
    const { type = 'default' } = req.body;
    const { ownerId = null } = req.query;

    if (!req.file) {
      return errorResponse(res, 400, 'No file uploaded');
    }

    const fileRecord = await FileService.uploadSingleFile(
      req.file,
      ownerId,
      ownerType,
      type
    );

    return successResponse(res, 201, 'File uploaded successfully', fileRecord);
  } catch (err) {
    logger.error(`Single upload failed: ${err.message}`);
    return errorResponse(res, 500, 'Single upload failed', err.message);
  }
};

const multipleFileUpload = async (req, res) => {
  try {
    const { ownerType } = req.params;
    const { type = 'default' } = req.body;
    const { ownerId = null } = req.query;

    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 400, 'No files uploaded');
    }

    const uploadedFiles = await FileService.uploadMultipleFiles(
      req.files,
      ownerId,
      ownerType,
      type
    );

    return successResponse(res, 201, 'Files uploaded successfully', uploadedFiles);
  } catch (err) {
    logger.error(`Bulk upload failed: ${err.message}`);
    return errorResponse(res, 500, 'Bulk upload failed', err.message);
  }
};

const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return errorResponse(res, 400, 'File ID is required');
    }

    const deletedFile = await FileService.deleteFile(fileId);

    return successResponse(res, 200, 'File deleted successfully', deletedFile);
  } catch (err) {
    logger.error(`File deletion failed: ${err.message}`);
    return errorResponse(res, 500, 'File deletion failed', err.message);
  }
};

const deleteMultipleFiles = async (req, res) => {
  try {
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return errorResponse(res, 400, 'File IDs array is required');
    }

    const deletedCount = await FileService.deleteMultipleFiles(fileIds);

    return successResponse(res, 200, `${deletedCount} files deleted successfully`, { deletedCount });
  } catch (err) {
    logger.error(`Multiple file deletion failed: ${err.message}`);
    return errorResponse(res, 500, 'Multiple file deletion failed', err.message);
  }
};

const getFilesByOwner = async (req, res) => {
  try {
    const { ownerId, ownerType } = req.params;
    const { type } = req.query;

    const files = await FileService.getFilesByOwner(ownerId, ownerType, type);

    return successResponse(res, 200, 'Files fetched successfully', files);
  } catch (err) {
    logger.error(`Fetch files failed: ${err.message}`);
    return errorResponse(res, 500, 'Fetch files failed', err.message);
  }
};

module.exports = {
  singleFileUpload,
  multipleFileUpload,
  deleteFile,
  deleteMultipleFiles,
  getFilesByOwner
};