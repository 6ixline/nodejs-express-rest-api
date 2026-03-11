const ProductService = require('./productService');
const MakeService = require("./makeService");
const CategoryService = require("./categoryService");
const logger = require('../config/logger');
const ExcelJS = require('exceljs');
const { Product } = require('../models');

// Handle Excel errors like #N/A, #REF!, etc.
const cleanCellValue = (value) => {
  if (value === null || value === undefined) return null;
  
  if (typeof value === 'object') {
    if (value.error) return null;
    if (value instanceof Date) return value.toISOString();
    return null;
  }
  
  if (value === '') return null;
  return value;
};

const parseNumeric = (value) => {
  const cleaned = cleanCellValue(value);
  if (cleaned === null) return null;
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

const normalizeColumnName = (colName) => {
  if (!colName) return '';
  return colName.toString().trim().replace(/\s+/g, ' ');
};

const getRowValue = (row, ...possibleNames) => {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      const cleaned = cleanCellValue(row[name]);
      if (cleaned !== null) return cleaned;
    }
  }
  return null;
};

const mapExcelRowToProductData = (row, makeId, categoryId) => {
  return {
    makeId: makeId,
    categoryId: categoryId,
    name: getRowValue(row, 'Name', 'name'),
    product_code: getRowValue(row, 'Product Code / Part No.', 'Product Code', 'product_code'),
    ref_code: getRowValue(row, 'Part Category', 'part_category', 'ref_code'),
    color: getRowValue(row, 'Color', 'color'),
    mrp: parseNumeric(getRowValue(row, 'MRP', 'mrp')),
    std_pkg: getRowValue(row, 'STD PKG.', 'std_pkg', 'STD PKG'),
    mast_pkg: getRowValue(row, 'MAST. PKG.', 'mast_pkg', 'MAST PKG'),
    lumax_part_no: getRowValue(row, 'Lumax Part No.', 'Lumax Part No', 'lumax_part_no'),
    varroc_part_no: getRowValue(row, 'Varroc Part No', 'Varroc Part No.', 'varroc_part_no'),
    butter_size: getRowValue(row, 'Butter Size', 'butter_size'),
    pt_bc: getRowValue(row, 'PT B/C', 'pt_bc', 'PT BC'),
    pt_tc: getRowValue(row, 'PT  T/C', 'PT T/C', 'pt_tc', 'PT TC'),
    shell_name: getRowValue(row, 'Shell Name', 'shell_name'),
    ic_box_size: getRowValue(row, 'IC Box Size', 'ic_box_size'),
    mc_box_size: getRowValue(row, 'Mc Box Size', 'mc_box_size'),
    graphic: getRowValue(row, 'Graphic', 'graphic'),
    varroc_mrp: parseNumeric(getRowValue(row, 'Varroc MRP', 'varroc_mrp')),
    lumax_mrp: parseNumeric(getRowValue(row, 'Lumax MRP', 'lumax_mrp')),
    visor_glass: getRowValue(row, 'VISOR Glass', 'visor_glass'),
    status: 'active'
  };
};

const parseExcelFile = async (filePath) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('No worksheet found in Excel file');
    }

    const rows = [];
    const headers = [];
    
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      if (cell.value) {
        headers[colNumber] = normalizeColumnName(cell.value);
      }
    });

    logger.info(`Excel headers found: ${headers.filter(h => h).join(', ')}`);

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      
      const rowData = {};
      let hasData = false;
      
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          const cleanedValue = cleanCellValue(cell.value);
          if (cleanedValue !== null && cleanedValue !== undefined) {
            rowData[header] = cleanedValue;
            hasData = true;
          }
        }
      });
      
      if (hasData) {
        rows.push(rowData);
      }
    });
    
    logger.info(`Parsed ${rows.length} data rows from Excel`);
    return rows;
  } catch (err) {
    logger.error(`Error parsing Excel file: ${err.message}`);
    throw new Error(`Invalid Excel file format: ${err.message}`);
  }
};

const bulkImportProducts = async (filePath, createdBy) => {
  try {
    const rows = await parseExcelFile(filePath);
    
    if (rows.length === 0) {
      throw new Error('Excel file is empty or contains no valid data rows');
    }

    const results = {
      total: rows.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
      makesCreated: new Set(),
      categoriesCreated: new Set()
    };

    const makesCache = new Map();
    const categoriesCache = new Map();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const makeTitle = (getRowValue(row, 'Make', 'make') || '').toString().trim();
        const categoryTitle = (getRowValue(row, 'Category', 'category') || '').toString().trim();
        
        if (!makeTitle || !categoryTitle) {
          throw new Error('Make and Category are required');
        }

        // Get or create Make
        let make;
        const makeCacheKey = makeTitle.toLowerCase();
        
        if (makesCache.has(makeCacheKey)) {
          make = makesCache.get(makeCacheKey);
        } else {
          const allMakes = await MakeService.getActiveMakes();
          make = allMakes.find(m => m.title.toLowerCase() === makeCacheKey);
          
          if (!make) {
            const slug = makeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            make = await MakeService.createMake(makeTitle, slug, 'active', createdBy);
            results.makesCreated.add(makeTitle);
            logger.info(`Make created during import: ${makeTitle}`);
          }
          
          makesCache.set(makeCacheKey, make);
        }

        // Get or create Category
        let category;
        const categoryCacheKey = categoryTitle.toLowerCase();
        
        if (categoriesCache.has(categoryCacheKey)) {
          category = categoriesCache.get(categoryCacheKey);
        } else {
          const allCategories = await CategoryService.getActiveCategories();
          category = allCategories.find(c => c.title.toLowerCase() === categoryCacheKey);
          
          if (!category) {
            const slug = categoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            category = await CategoryService.createCategory(categoryTitle, slug, null, 'active', createdBy);
            results.categoriesCreated.add(categoryTitle);
            logger.info(`Category created during import: ${categoryTitle}`);
          }
          
          categoriesCache.set(categoryCacheKey, category);
        }

        const productData = mapExcelRowToProductData(row, make.id, category.id);

        if (!productData.product_code || !productData.product_code.toString().trim()) {
          throw new Error('Product Code is required');
        }

        if (!productData.name || !productData.name.toString().trim()) {
          throw new Error('Product Name is required');
        }

        productData.product_code = productData.product_code.toString().trim();

        // Check if product exists
        let existingProduct = null;
        try {
          const allProducts = await ProductService.getAllProducts({
            page: 1,
            limit: 1,
            search: productData.product_code
          });
          
          existingProduct = allProducts.data.find(p => p.product_code === productData.product_code);
        } catch (err) {
          // Product doesn't exist
        }

        if (existingProduct) {
          await ProductService.updateProduct(
            existingProduct.id,
            productData,
            null,
            null,
            createdBy
          );
          
          results.updated++;
          logger.info(`Product updated via import: ${productData.product_code}`);
        } else {
          await ProductService.createProduct(
            productData,
            null,
            createdBy
          );
          
          results.created++;
          logger.info(`Product created via import: ${productData.product_code}`);
        }

      } catch (err) {
        results.failed++;
        results.errors.push({
          row: i + 2,
          product_code: getRowValue(row, 'Product Code / Part No.', 'Product Code', 'product_code') || 'N/A',
          make: getRowValue(row, 'Make', 'make') || 'N/A',
          category: getRowValue(row, 'Category', 'category') || 'N/A',
          error: err.message
        });
        logger.error(`Error processing row ${i + 2}: ${err.message}`);
      }
    }

    results.makesCreated = Array.from(results.makesCreated);
    results.categoriesCreated = Array.from(results.categoriesCreated);

    logger.info(`Bulk import completed: ${results.created} created, ${results.updated} updated, ${results.failed} failed`);
    return results;

  } catch (err) {
    logger.error(`Bulk import failed: ${err.message}`);
    throw err;
  }
};

const bulkImportKeywords = async (filePath, updatedBy) => {
  try {
    const rows = await parseExcelFile(filePath);

    if (rows.length === 0) {
      throw new Error('Excel file is empty or contains no valid data rows');
    }

    const results = {
      total: rows.length,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        const productCode = getRowValue(row, 'Product Code / Part No.', 'Product Code', 'product_code');

        if (!productCode || !productCode.toString().trim()) {
          throw new Error('Product Code is required');
        }

        const keywordParts = [
          getRowValue(row, 'Keyword (Comma Seperated)'),
          getRowValue(row, 'VV'),
          getRowValue(row, 'keywords'),
        ].filter(Boolean);

        if (keywordParts.length === 0) {
          results.skipped++;
          continue;
        }

        const keyword = keywordParts.join(',');

        // Direct exact match lookup
        const existingProduct = await Product.findOne({
          where: { product_code: productCode.toString().trim() }
        });

        if (!existingProduct) {
          throw new Error(`Product not found: ${productCode}`);
        }

        existingProduct.keyword = keyword;
        existingProduct.updated_by = updatedBy;
        await existingProduct.save();

        results.updated++;
        logger.info(`Keywords updated for product: ${productCode}`);

      } catch (err) {
        results.failed++;
        results.errors.push({
          row: i + 2,
          product_code: getRowValue(row, 'Product Code / Part No.', 'Product Code', 'product_code') || 'N/A',
          error: err.message
        });
        logger.error(`Error processing row ${i + 2}: ${err.message}`);
      }
    }

    logger.info(`Keyword import completed: ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`);
    return results;

  } catch (err) {
    logger.error(`Keyword import failed: ${err.message}`);
    throw err;
  }
};

const validateExcelStructure = async (filePath) => {
  try {
    const rows = await parseExcelFile(filePath);
    
    if (rows.length === 0) {
      return { valid: false, message: 'Excel file is empty or contains no valid data rows' };
    }

    const firstRow = rows[0];
    const requiredColumns = [
      { main: 'Make', alternates: ['make'] },
      { main: 'Category', alternates: ['category'] },
      { main: 'Name', alternates: ['name'] },
      { main: 'Product Code / Part No.', alternates: ['Product Code', 'product_code'] }
    ];
    
    const missingColumns = [];

    for (const col of requiredColumns) {
      const found = col.main in firstRow || 
                    col.alternates.some(alt => alt in firstRow);
      
      if (!found) {
        missingColumns.push(col.main);
      }
    }

    if (missingColumns.length > 0) {
      return {
        valid: false,
        message: `Missing required columns: ${missingColumns.join(', ')}`
      };
    }

    logger.info(`Excel validation - First row columns: ${Object.keys(firstRow).join(', ')}`);

    return { 
      valid: true, 
      message: 'Excel file structure is valid',
      rowCount: rows.length
    };

  } catch (err) {
    logger.error(`Excel validation error: ${err.message}`);
    return { valid: false, message: err.message };
  }
};

const generateExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Products');

  worksheet.columns = [
    { header: 'SNO', key: 'sno', width: 8 },
    { header: 'Make', key: 'make', width: 15 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Part Category', key: 'part_category', width: 15 },
    { header: 'Product Code / Part No.', key: 'product_code', width: 20 },
    { header: 'Glass', key: 'glass', width: 10 },
    { header: 'Color', key: 'color', width: 15 },
    { header: 'MRP', key: 'mrp', width: 10 },
    { header: 'STD PKG.', key: 'std_pkg', width: 12 },
    { header: 'MAST. PKG.', key: 'mast_pkg', width: 12 },
    { header: 'Lumax Part No.', key: 'lumax_part_no', width: 20 },
    { header: 'Varroc Part No', key: 'varroc_part_no', width: 20 },
    { header: 'Butter Size', key: 'butter_size', width: 12 },
    { header: 'PT B/C', key: 'pt_bc', width: 15 },
    { header: 'PT  T/C', key: 'pt_tc', width: 15 },
    { header: 'Shell Name', key: 'shell_name', width: 20 },
    { header: 'IC Box Size', key: 'ic_box_size', width: 15 },
    { header: 'Mc Box Size', key: 'mc_box_size', width: 15 },
    { header: 'Graphic', key: 'graphic', width: 10 },
    { header: 'Varroc MRP', key: 'varroc_mrp', width: 12 },
    { header: 'Lumax MRP', key: 'lumax_mrp', width: 12 },
    { header: 'VISOR Glass', key: 'visor_glass', width: 12 },
    { header: 'Images Name (Comma Seperated)', key: 'images', width: 30 }
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };

  worksheet.addRows([
    {
      sno: 1,
      make: 'HH',
      category: 'FF',
      name: 'FF SPLNDR BLACK (BP)',
      part_category: 'AXA-301',
      product_code: 'AXA-301BLK BP',
      glass: 'NA',
      color: 'GLOSSY BLACK',
      mrp: 351,
      std_pkg: '10',
      mast_pkg: '-',
      lumax_part_no: '216-FF-SPL-BL-BP',
      varroc_part_no: 'ABSP-SPLD-FF01BP',
      butter_size: '20*29',
      pt_bc: 'GLOSSY BLACK',
      pt_tc: 'GLOSSY BLACK',
      shell_name: 'FM SPLENDOR',
      ic_box_size: 'BPFM-02',
      mc_box_size: 'NA',
      graphic: 'No',
      varroc_mrp: 4038,
      lumax_mrp: '',
      visor_glass: 'NA',
      images: 'AXA-301BLK BP'
    },
    {
      sno: 2,
      make: 'HH',
      category: 'FF',
      name: 'FF SPLNDR RED (BP)',
      part_category: 'AXA-301',
      product_code: 'AXA-301R BP',
      glass: 'NA',
      color: 'BLAZING RED',
      mrp: 351,
      std_pkg: '10',
      mast_pkg: '-',
      lumax_part_no: '216-FF-SPL-RD-BP',
      varroc_part_no: 'ABSP-SPLD-FF01RP',
      butter_size: '20*29',
      pt_bc: 'BLAZING RED B/C',
      pt_tc: 'BLAZING RED T/C',
      shell_name: 'FM SPLENDOR',
      ic_box_size: 'BPFM-02',
      mc_box_size: 'NA',
      graphic: 'No',
      varroc_mrp: 4038,
      lumax_mrp: '',
      visor_glass: 'NA',
      images: 'AXA-301R BP'
    }
  ]);

  return workbook;
};

module.exports = {
  bulkImportProducts,
  bulkImportKeywords,
  validateExcelStructure,
  generateExcelTemplate,
  parseExcelFile
};