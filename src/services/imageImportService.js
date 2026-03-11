const { Product, Files } = require('../models');
const logger = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');
const ExcelJS = require('exceljs');

const PRODUCT_IMAGES_FOLDER = path.join(__dirname, '../../product-images');

const findImageFile = async (imageName) => {
  const extensions = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG', 'Jpg', 'Jpeg', 'Png'];
 
  const nameVariations = [
    imageName,
    imageName.replace(/\s+BP\s*$/i, ''),
    imageName.replace(/\s+/g, ''),
  ];
  
  // Remove duplicates
  const uniqueVariations = [...new Set(nameVariations)];
  
  // Try each variation with each extension
  for (const variation of uniqueVariations) {
    for (const ext of extensions) {
      const filePath = path.join(PRODUCT_IMAGES_FOLDER, `${variation}.${ext}`);
      try {
        await fs.access(filePath);
        return { filePath, extension: ext };
      } catch (err) {
        continue;
      }
    }
  }
  
  return null;
};

const copyImageToUploads = async (sourcePath, productCode) => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  
  try {
    await fs.access(uploadsDir);
  } catch (err) {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
  
  const ext = path.extname(sourcePath);
  const timestamp = Date.now();
  const filename = `${productCode}-${timestamp}${ext}`;
  const destPath = path.join(uploadsDir, filename);
  
  await fs.copyFile(sourcePath, destPath);
  
  return filename;
};

const checkMissingImages = async () => {
  try {
    try {
      await fs.access(PRODUCT_IMAGES_FOLDER);
    } catch (err) {
      await fs.mkdir(PRODUCT_IMAGES_FOLDER, { recursive: true });
      logger.info(`Created product-images folder at: ${PRODUCT_IMAGES_FOLDER}`);
    }

    const products = await Product.findAll({
      attributes: ['id', 'product_code', 'name']
    });

    const results = {
      total: products.length,
      found: [],
      missing: [],
      imagesFolderPath: PRODUCT_IMAGES_FOLDER
    };

    for (const product of products) {
      const imageFile = await findImageFile(product.product_code);
      
      if (imageFile) {
        results.found.push({
          product_code: product.product_code,
          name: product.name,
          file: path.basename(imageFile.filePath)
        });
      } else {
        results.missing.push({
          product_code: product.product_code,
          name: product.name
        });
      }
    }

    logger.info(`Image check completed: ${results.found.length} found, ${results.missing.length} missing`);
    return results;

  } catch (err) {
    logger.error(`Error checking images: ${err.message}`);
    throw err;
  }
};

const generateMissingImagesReport = async () => {
  try {
    const checkResults = await checkMissingImages();
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Missing Images Report');

    worksheet.columns = [
      { header: 'SNO', key: 'sno', width: 8 },
      { header: 'Product Code', key: 'product_code', width: 25 },
      { header: 'Product Name', key: 'name', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Image File', key: 'image_file', width: 30 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.insertRow(1, ['Missing Images Report']);
    worksheet.mergeCells('A1:E1');
    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.insertRow(2, ['']);
    worksheet.insertRow(3, ['Summary:']);
    worksheet.getRow(3).font = { bold: true };
    worksheet.insertRow(4, [`Total Products: ${checkResults.total}`]);
    worksheet.insertRow(5, [`Images Found: ${checkResults.found.length}`]);
    worksheet.insertRow(6, [`Images Missing: ${checkResults.missing.length}`]);
    worksheet.insertRow(7, [`Images Folder: ${checkResults.imagesFolderPath}`]);
    worksheet.insertRow(8, ['']);

    let sno = 1;
    checkResults.missing.forEach(item => {
      const row = worksheet.addRow({
        sno: sno++,
        product_code: item.product_code,
        name: item.name,
        status: 'Missing',
        image_file: '-'
      });
      
      row.getCell('status').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF0000' }
      };
      row.getCell('status').font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    checkResults.found.forEach(item => {
      const row = worksheet.addRow({
        sno: sno++,
        product_code: item.product_code,
        name: item.name,
        status: 'Found',
        image_file: item.file
      });
      
      row.getCell('status').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00B050' }
      };
      row.getCell('status').font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    logger.info('Missing images Excel report generated');
    return workbook;

  } catch (err) {
    logger.error(`Error generating missing images report: ${err.message}`);
    throw err;
  }
};

const generateProductImagesReport = async () => {
  try {
    const products = await Product.findAll({
      attributes: ['id', 'product_code', 'name'],
      order: [['product_code', 'ASC']]
    });

    // Fetch all product images in one query (more efficient)
    const productIds = products.map(p => p.id);
    const allImages = await Files.findAll({
      where: {
        owner_id: productIds,
        owner_type: 'product',
        type: 'product_image',
        status: 'active'
      },
      attributes: ['owner_id', 'id', 'url', 'name'],
      order: [['createdAt', 'ASC']],
      raw: true
    });

    // Group images by product ID
    const imageMap = new Map();
    allImages.forEach(img => {
      if (!imageMap.has(img.owner_id)) {
        imageMap.set(img.owner_id, []);
      }
      imageMap.get(img.owner_id).push(img);
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Product Images Report');

    worksheet.columns = [
      { header: 'SNO', key: 'sno', width: 8 },
      { header: 'Product Code', key: 'product_code', width: 25 },
      { header: 'Product Name', key: 'name', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Image File', key: 'image_file', width: 60 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add title
    worksheet.insertRow(1, ['Product Images Report']);
    worksheet.mergeCells('A1:E1');
    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Calculate summary stats
    let productsWithImages = 0;
    let productsWithoutImages = 0;
    let totalImageCount = 0;

    products.forEach(product => {
      const images = imageMap.get(product.id) || [];
      if (images.length > 0) {
        productsWithImages++;
        totalImageCount += images.length;
      } else {
        productsWithoutImages++;
      }
    });

    // Add summary section
    worksheet.insertRow(2, ['']);
    worksheet.insertRow(3, ['Summary:']);
    worksheet.getRow(3).font = { bold: true };
    worksheet.insertRow(4, [`Total Products: ${products.length}`]);
    worksheet.insertRow(5, [`Products with Images: ${productsWithImages}`]);
    worksheet.insertRow(6, [`Products without Images: ${productsWithoutImages}`]);
    worksheet.insertRow(7, [`Total Images: ${totalImageCount}`]);
    worksheet.insertRow(8, ['']);

    // Add data rows
    let sno = 1;
    products.forEach(product => {
      const images = imageMap.get(product.id) || [];

      if (images.length > 0) {
        // Product has images - add one row per image
        images.forEach((image, index) => {
          const row = worksheet.addRow({
            sno: index === 0 ? sno : '', // Only show SNO on first row for each product
            product_code: index === 0 ? product.product_code : '',
            name: index === 0 ? product.name : '',
            status: 'Found',
            image_file: '' // We'll set this as a hyperlink below
          });
          
          // Add hyperlink to the image URL
          const imageCell = row.getCell('image_file');
          
          // Construct full URL (adjust this based on your server configuration)
          const fullUrl = image.url.startsWith('http') 
            ? image.url 
            : 'http://localhost:5000' + image.url;
          
          imageCell.value = {
            text: product.product_code, // Display text
            hyperlink: fullUrl, // Actual link
            tooltip: 'Click to view image'
          };
          imageCell.font = { 
            color: { argb: 'FF0000FF' }, // Blue color for links
            underline: true 
          };
          
          row.getCell('status').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF00B050' }
          };
          row.getCell('status').font = { color: { argb: 'FFFFFFFF' }, bold: true };
        });
        sno++;
      } else {
        // Product has no images
        const row = worksheet.addRow({
          sno: sno++,
          product_code: product.product_code,
          name: product.name,
          status: 'Missing',
          image_file: '-'
        });
        
        row.getCell('status').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' }
        };
        row.getCell('status').font = { color: { argb: 'FFFFFFFF' }, bold: true };
      }
    });

    logger.info(`Product images report generated: ${productsWithImages} with images, ${productsWithoutImages} without images`);
    return workbook;

  } catch (err) {
    logger.error(`Error generating product images report: ${err.message}`);
    throw err;
  }
};

const bulkUploadProductImages = async (createdBy, overwrite = false) => {
  try {
    try {
      await fs.access(PRODUCT_IMAGES_FOLDER);
    } catch (err) {
      await fs.mkdir(PRODUCT_IMAGES_FOLDER, { recursive: true });
      logger.info(`Created product-images folder at: ${PRODUCT_IMAGES_FOLDER}`);
    }

    const products = await Product.findAll({
      attributes: ['id', 'product_code', 'name']
    });

    const results = {
      total: products.length,
      uploaded: [],
      skipped: [],
      missing: [],
      errors: [],
      imagesFolderPath: PRODUCT_IMAGES_FOLDER
    };

    for (const product of products) {
      try {
        if (!overwrite) {
          const existingImages = await Files.findAll({
            where: {
              owner_id: product.id,
              owner_type: 'product',
              type: "product_image",
              status: 'active'
            }
          });

          if (existingImages.length > 0) {
            results.skipped.push({
              product_code: product.product_code,
              reason: 'Already has images'
            });
            continue;
          }
        }

        const imageFile = await findImageFile(product.product_code);
        
        if (!imageFile) {
          results.missing.push({
            product_code: product.product_code,
            name: product.name
          });
          continue;
        }

        const filename = await copyImageToUploads(imageFile.filePath, product.product_code);

        await Files.create({
          name: filename,
          url: `/uploads/${filename}`,
          owner_id: product.id,
          owner_type: 'product',
          type: 'product_image',
          status: 'active'
        });

        results.uploaded.push({
          product_code: product.product_code,
          name: product.name,
          file: filename
        });

        logger.info(`Image uploaded for product: ${product.product_code}`);

      } catch (err) {
        results.errors.push({
          product_code: product.product_code,
          error: err.message
        });
        logger.error(`Error uploading image for ${product.product_code}: ${err.message}`);
      }
    }

    logger.info(`Bulk image upload completed: ${results.uploaded.length} uploaded, ${results.skipped.length} skipped, ${results.missing.length} missing`);
    return results;

  } catch (err) {
    logger.error(`Bulk image upload failed: ${err.message}`);
    throw err;
  }
};

const uploadImagesForProducts = async (productCodes, createdBy, overwrite = false) => {
  try {
    try {
      await fs.access(PRODUCT_IMAGES_FOLDER);
    } catch (err) {
      await fs.mkdir(PRODUCT_IMAGES_FOLDER, { recursive: true });
      logger.info(`Created product-images folder at: ${PRODUCT_IMAGES_FOLDER}`);
    }

    const results = {
      total: productCodes.length,
      uploaded: [],
      missing: [],
      notFound: [],
      errors: [],
      imagesFolderPath: PRODUCT_IMAGES_FOLDER
    };

    for (const productCode of productCodes) {
      try {
        const product = await Product.findOne({
          where: { product_code: productCode }
        });

        if (!product) {
          results.notFound.push(productCode);
          continue;
        }

        if (!overwrite) {
          const existingImages = await Files.findAll({
            where: {
              owner_id: product.id,
              owner_type: 'product',
              type: "product_image",
              status: 'active'
            }
          });

          if (existingImages.length > 0) {
            results.uploaded.push({
              product_code: productCode,
              status: 'skipped',
              reason: 'Already has images'
            });
            continue;
          }
        }

        const imageFile = await findImageFile(productCode);
        
        if (!imageFile) {
          results.missing.push(productCode);
          continue;
        }

        const filename = await copyImageToUploads(imageFile.filePath, productCode);

        await Files.create({
          name: filename,
          url: `/uploads/${filename}`,
          owner_id: product.id,
          owner_type: 'product',
          type: 'product_image',
          status: 'active'
        });

        results.uploaded.push({
          product_code: productCode,
          status: 'success',
          file: filename
        });

        logger.info(`Image uploaded for product: ${productCode}`);

      } catch (err) {
        results.errors.push({
          product_code: productCode,
          error: err.message
        });
        logger.error(`Error uploading image for ${productCode}: ${err.message}`);
      }
    }

    return results;

  } catch (err) {
    logger.error(`Upload images for products failed: ${err.message}`);
    throw err;
  }
};

module.exports = {
  checkMissingImages,
  generateMissingImagesReport,
  bulkUploadProductImages,
  uploadImagesForProducts,
  generateProductImagesReport,
  PRODUCT_IMAGES_FOLDER
};