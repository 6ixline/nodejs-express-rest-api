const { Op } = require('sequelize');
const { Product, Make, Category, Admin, Files } = require('../models');
const FileService = require('./fileService');
const logger = require('../config/logger');

/**
 * Create a new product
 */
const createProduct = async (productData, imageIds, createdBy) => {
  try {
    const product = await Product.create({
      make_id: productData.makeId,
      category_id: productData.categoryId,
      name: productData.name,
      product_code: productData.product_code,
      ref_code: productData.ref_code || null,
      keywrod: productData.keyword || null,
      color: productData.color,
      mrp: productData.mrp,
      std_pkg: productData.std_pkg,
      mast_pkg: productData.mast_pkg,
      lumax_part_no: productData.lumax_part_no,
      varroc_part_no: productData.varroc_part_no,
      butter_size: productData.butter_size,
      pt_bc: productData.pt_bc,
      pt_tc: productData.pt_tc,
      shell_name: productData.shell_name,
      ic_box_size: productData.ic_box_size,
      mc_box_size: productData.mc_box_size,
      graphic: productData.graphic,
      varroc_mrp: productData.varroc_mrp,
      lumax_mrp: productData.lumax_mrp,
      visor_glass: productData.visor_glass,
      status: productData.status || 'active',
      created_by: createdBy,
      updated_by: createdBy
    });

    // Activate images if provided
    if (imageIds && imageIds.length > 0) {
      await FileService.activateTempFiles(imageIds, product.id, 'product');
    }

    logger.info(`Product created: ${product.id} by admin ${createdBy}`);
    return await getProductById(product.id);
  } catch (err) {
    logger.error(`Error creating product: ${err.message}`);
    throw err;
  }
};

/**
 * Get all products with pagination and search
 */
const getAllProducts = async ({ page = 1, limit = 10, search = '', makeId, categoryId, status, refCode, sortBy = 'createdAt', order = 'DESC' }) => {
  try {
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search) {
      const tokens = search.trim().split(/\s+/);

      whereClause[Op.and] = tokens.map(token => ({
        [Op.or]: [
          { name: { [Op.like]: `%${token}%` } },
          { product_code: { [Op.like]: `%${token}%` } },
          { ref_code: { [Op.like]: `%${token}%` } },
          { keyword: { [Op.like]: `%${token}%` } },
          { '$make.title$': { [Op.like]: `%${token}%` } },
          { '$category.title$': { [Op.like]: `%${token}%` } }
        ]
      }));
    }

    if (status) {
      let statusValues;
      if (Array.isArray(status)) {
        statusValues = status;
      } else if (typeof status === 'string' && status.includes(',')) {
        statusValues = status.split(',').map(s => s.trim());
      } else {
        statusValues = [status];
      }
      whereClause.status = { [Op.in]: statusValues };
    }

    if (makeId) whereClause.make_id = makeId;
    if (categoryId) whereClause.category_id = categoryId;
    if (refCode) whereClause.ref_code = { [Op.like]: `%${refCode}%` };

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Make,
          as: 'make',
          attributes: ['id', 'title', 'slug']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'title', 'slug']
        },
        {
          model: Admin,
          as: 'creator',
          attributes: ['id', 'username', 'displayName']
        }
      ],
      order: [[sortBy, order]],
      offset,
      limit: parseInt(limit),
      distinct: true
    });

    if (rows.length === 0) {
      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
          totalItems: count
        }
      };
    }

    // Fetch images for all products
    const productIds = rows.map(p => p.id);
    const images = await Files.findAll({
      where: {
        owner_id: productIds,
        owner_type: 'product',
        type: 'product_image',
        status: 'active'
      },
      attributes: ['owner_id', 'id', 'url'],
      order: [['createdAt', 'ASC']],
      raw: true
    });

    const imageMap = new Map();
    images.forEach(img => {
      if (!imageMap.has(img.owner_id)) {
        imageMap.set(img.owner_id, img.url);
      }
    });

    // Attach thumbnail to products
    const productsData = rows.map(product => {
      const productData = product.toJSON();
      productData.thumbnail = imageMap.get(product.id) || null;
      return productData;
    });

    return {
      data: productsData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        totalItems: count
      }
    };
  } catch (err) {
    logger.error(`Error fetching products: ${err.message}`);
    throw err;
  }
};

/**
 * Get product by ID with images and related products
 */
const getProductById = async (id) => {
  try {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Make,
          as: 'make',
          attributes: ['id', 'title', 'slug']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'title', 'slug']
        },
        {
          model: Admin,
          as: 'creator',
          attributes: ['id', 'username', 'displayName']
        },
        {
          model: Admin,
          as: 'updater',
          attributes: ['id', 'username', 'displayName']
        }
      ]
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Fetch images
    const images = await Files.findAll({
      where: {
        owner_id: product.id,
        owner_type: 'product',
        type: 'product_image',
        status: 'active'
      },
      attributes: ['id', 'url', 'name'],
      order: [['createdAt', 'ASC']],
      raw: true
    });

    const productData = product.toJSON();
    productData.images = images.map(img => ({
      id: img.id,
      url: img.url,
      name: img.name
    }));

    // Get related products if ref_code exists
    if (productData.ref_code) {
      const relatedProducts = await Product.findAll({
        where: {
          ref_code: { [Op.like]: `%${productData.ref_code}%` },
          id: { [Op.ne]: product.id }
        },
        attributes: ['id', 'name', 'product_code', 'color', 'mrp', 'status'],
        include: [
          {
            model: Make,
            as: 'make',
            attributes: ['title']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['title']
          }
        ],
        limit: 10
      });

      // Fetch images for Related products
      const rProductIds = relatedProducts.map(p => p.id);
      const rImages = await Files.findAll({
        where: {
          owner_id: rProductIds,
          owner_type: 'product',
          type: 'product_image',
          status: 'active'
        },
        attributes: ['owner_id', 'id', 'url'],
        order: [['createdAt', 'ASC']],
        raw: true
      });

      const rimageMap = new Map();
      rImages.forEach(img => {
        if (!rimageMap.has(img.owner_id)) {
          rimageMap.set(img.owner_id, img.url);
        }
      });

      // Attach thumbnail to Related products
      const relatedProductsData = relatedProducts.map(product => {
        const productData = product.toJSON();
        productData.thumbnail = rimageMap.get(product.id) || null;
        return productData;
      });

      productData.relatedProducts = relatedProductsData;
    }

    return productData;
  } catch (err) {
    logger.error(`Error fetching product: ${err.message}`);
    throw err;
  }
};

/**
 * Update product
 */
const updateProduct = async (id, productData, imageIds, imagesToDelete, updatedBy) => {
  try {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new Error('Product not found');
    }

    // Check if product_code is being changed and if it already exists
    if (productData.product_code && productData.product_code !== product.product_code) {
      const existingProduct = await Product.findOne({
        where: {
          product_code: productData.product_code,
          id: { [Op.ne]: id }
        }
      });
      if (existingProduct) {
        throw new Error('Product with this product code already exists');
      }
    }

    // Update all fields
    if (productData.makeId !== undefined) product.make_id = productData.makeId;
    if (productData.categoryId !== undefined) product.category_id = productData.categoryId;
    if (productData.name !== undefined) product.name = productData.name;
    if (productData.product_code !== undefined) product.product_code = productData.product_code;
    if (productData.ref_code !== undefined) product.ref_code = productData.ref_code;
    if (productData.color !== undefined) product.color = productData.color;
    if (productData.mrp !== undefined) product.mrp = productData.mrp;
    if (productData.std_pkg !== undefined) product.std_pkg = productData.std_pkg;
    if (productData.mast_pkg !== undefined) product.mast_pkg = productData.mast_pkg;
    if (productData.lumax_part_no !== undefined) product.lumax_part_no = productData.lumax_part_no;
    if (productData.varroc_part_no !== undefined) product.varroc_part_no = productData.varroc_part_no;
    if (productData.butter_size !== undefined) product.butter_size = productData.butter_size;
    if (productData.pt_bc !== undefined) product.pt_bc = productData.pt_bc;
    if (productData.pt_tc !== undefined) product.pt_tc = productData.pt_tc;
    if (productData.shell_name !== undefined) product.shell_name = productData.shell_name;
    if (productData.ic_box_size !== undefined) product.ic_box_size = productData.ic_box_size;
    if (productData.mc_box_size !== undefined) product.mc_box_size = productData.mc_box_size;
    if (productData.graphic !== undefined) product.graphic = productData.graphic;
    if (productData.varroc_mrp !== undefined) product.varroc_mrp = productData.varroc_mrp;
    if (productData.lumax_mrp !== undefined) product.lumax_mrp = productData.lumax_mrp;
    if (productData.visor_glass !== undefined) product.visor_glass = productData.visor_glass;
    if (productData.status !== undefined) product.status = productData.status;
    if (productData.keyword !== undefined) product.keyword = productData.keyword;
    product.updated_by = updatedBy;

    await product.save();

    // Handle image deletions
    if (imagesToDelete && imagesToDelete.length > 0) {
      await FileService.deleteMultipleFiles(imagesToDelete);
    }

    // Activate new temp images
    if (imageIds && imageIds.length > 0) {
      await FileService.activateTempFiles(imageIds, product.id, 'product');
    }

    logger.info(`Product updated: ${id} by admin ${updatedBy}`);
    return await getProductById(id);
  } catch (err) {
    logger.error(`Error updating product: ${err.message}`);
    throw err;
  }
};

/**
 * Delete product
 */
const deleteProduct = async (id) => {
  try {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new Error('Product not found');
    }

    // Delete all images
    const images = await Files.findAll({
      where: {
        owner_id: product.id,
        owner_type: 'product'
      }
    });

    if (images.length > 0) {
      const imageIds = images.map(img => img.id);
      await FileService.deleteMultipleFiles(imageIds);
    }

    await product.destroy();

    logger.info(`Product deleted: ${id}`);
    return product;
  } catch (err) {
    logger.error(`Error deleting product: ${err.message}`);
    throw err;
  }
};

/**
 * Bulk delete products
 */
const bulkDeleteProducts = async (ids) => {
  try {
    let deletedCount = 0;
    for (const id of ids) {
      await deleteProduct(id);
      deletedCount++;
    }

    logger.info(`${deletedCount} products deleted`);
    return deletedCount;
  } catch (err) {
    logger.error(`Error bulk deleting products: ${err.message}`);
    throw err;
  }
};

/**
 * Bulk update product status
 */
const bulkUpdateProductStatus = async (ids, status) => {
  try {
    const [updatedCount] = await Product.update(
      { status },
      { where: { id: ids } }
    );

    logger.info(`${updatedCount} products status updated to ${status}`);
    return updatedCount;
  } catch (err) {
    logger.error(`Error bulk updating products: ${err.message}`);
    throw err;
  }
};

/**
 * Get products by reference code
 */
const getProductsByRefCode = async (refCode) => {
  try {
    const products = await Product.findAll({
      where: {
        ref_code: { [Op.like]: `%${refCode}%` }
      },
      include: [
        {
          model: Make,
          as: 'make',
          attributes: ['title']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['title']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return products;
  } catch (err) {
    logger.error(`Error fetching products by ref code: ${err.message}`);
    throw err;
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateProductStatus,
  getProductsByRefCode
};