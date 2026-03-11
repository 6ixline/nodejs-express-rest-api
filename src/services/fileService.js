const { Files } = require('../models');
const logger = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Upload a single file
 */
const uploadSingleFile = async (file, ownerId, ownerType, type = 'default') => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const status = ownerId ? 'active' : 'temp';

    const fileRecord = await Files.create({
      name: file.filename,
      url: `/uploads/${file.filename}`,
      owner_id: ownerId,
      owner_type: ownerType,
      type,
      status
    });

    logger.info(`File uploaded successfully: ${file.filename} by owner ${ownerId || 'temp'}`);
    return fileRecord;
  } catch (err) {
    logger.error(`Error uploading single file: ${err.message}`);
    throw err;
  }
};

/**
 * Upload multiple files
 */
const uploadMultipleFiles = async (files, ownerId, ownerType, type = 'default') => {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const status = ownerId ? 'active' : 'temp';

    const uploadedFiles = await Promise.all(
      files.map(file =>
        Files.create({
          name: file.filename,
          url: `/uploads/${file.filename}`,
          owner_id: ownerId,
          owner_type: ownerType,
          type,
          status
        })
      )
    );

    logger.info(`${files.length} files uploaded successfully by owner ${ownerId || 'temp'}`);
    return uploadedFiles;
  } catch (err) {
    logger.error(`Error uploading multiple files: ${err.message}`);
    throw err;
  }
};

/**
 * Delete a file by ID
 */
const deleteFile = async (fileId) => {
  try {
    const file = await Files.findByPk(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    // Delete physical file from storage
    const filePath = path.join(__dirname, '..', 'public', file.url);
    try {
      await fs.unlink(filePath);
      logger.info(`Physical file deleted: ${filePath}`);
    } catch (err) {
      logger.warn(`Could not delete physical file: ${filePath}. ${err.message}`);
    }

    // Delete database record
    await file.destroy();

    logger.info(`File record deleted: ${fileId}`);
    return file;
  } catch (err) {
    logger.error(`Error deleting file: ${err.message}`);
    throw err;
  }
};

/**
 * Activate temp files (when owner is assigned)
 */
const activateTempFiles = async (fileIds, ownerId, ownerType) => {
  try {
    const [updatedCount] = await Files.update(
      { 
        owner_id: ownerId,
        owner_type: ownerType,
        status: 'active' 
      },
      { 
        where: { 
          id: fileIds,
          status: 'temp'
        } 
      }
    );

    logger.info(`${updatedCount} temp files activated for owner ${ownerId}`);
    return updatedCount;
  } catch (err) {
    logger.error(`Error activating temp files: ${err.message}`);
    throw err;
  }
};

/**
 * Get files by owner
 */
const getFilesByOwner = async (ownerId, ownerType, type = null) => {
  try {
    const whereClause = {
      owner_id: ownerId,
      owner_type: ownerType,
      status: 'active'
    };

    if (type) {
      whereClause.type = type;
    }

    const files = await Files.findAll({
      where: whereClause,
      order: [['createdAt', 'ASC']]
    });

    return files;
  } catch (err) {
    logger.error(`Error fetching files: ${err.message}`);
    throw err;
  }
};

/**
 * Delete multiple files
 */
const deleteMultipleFiles = async (fileIds) => {
  try {
    const files = await Files.findAll({
      where: { id: fileIds }
    });

    if (files.length === 0) {
      throw new Error('No files found');
    }

    // Delete physical files
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(__dirname, '..', 'public', file.url);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          logger.warn(`Could not delete physical file: ${filePath}`);
        }
      })
    );

    // Delete database records
    const deletedCount = await Files.destroy({
      where: { id: fileIds }
    });

    logger.info(`${deletedCount} files deleted`);
    return deletedCount;
  } catch (err) {
    logger.error(`Error deleting multiple files: ${err.message}`);
    throw err;
  }
};

/**
 * Clean up temp files older than specified hours
 */
const cleanupTempFiles = async (hoursOld = 24) => {
  try {
    const cutoffDate = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

    const tempFiles = await Files.findAll({
      where: {
        status: 'temp',
        createdAt: {
          [require('sequelize').Op.lt]: cutoffDate
        }
      }
    });

    if (tempFiles.length === 0) {
      return 0;
    }

    // Delete physical files
    await Promise.all(
      tempFiles.map(async (file) => {
        const filePath = path.join(__dirname, '..', 'public', file.url);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          logger.warn(`Could not delete temp file: ${filePath}`);
        }
      })
    );

    // Delete database records
    const deletedCount = await Files.destroy({
      where: {
        status: 'temp',
        createdAt: {
          [require('sequelize').Op.lt]: cutoffDate
        }
      }
    });

    logger.info(`Cleaned up ${deletedCount} temp files older than ${hoursOld} hours`);
    return deletedCount;
  } catch (err) {
    logger.error(`Error cleaning up temp files: ${err.message}`);
    throw err;
  }
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
  activateTempFiles,
  getFilesByOwner,
  deleteMultipleFiles,
  cleanupTempFiles
};