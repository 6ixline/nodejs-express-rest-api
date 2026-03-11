const express = require('express');
const router = express.Router();
const isAdmin = require('../../middlewares/adminMiddleware');
const isAdminOrUser = require("../../middlewares/isAdminOrUser")
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const { MakeController, CategoryController, ProductController, BulkImportController, ImageImportController  } = require("../../controllers/admin");

// Create uploads/temp directory for Excel imports if it doesn't exist
const excelUploadDir = path.resolve(__dirname, '../../uploads/temp');
if (!fs.existsSync(excelUploadDir)) {
  fs.mkdirSync(excelUploadDir, { recursive: true });
}

// Excel file upload configuration (separate from image uploads)
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, excelUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const excelUpload = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// ==================== MAKE ROUTES ====================
// Get all makes (paginated with search)
router.get('/makes', isAdmin, MakeController.getAllMakes);

// Get active makes (for dropdown)
router.get('/makes/active', isAdmin, MakeController.getActiveMakes);

// Get make by ID
router.get('/makes/:id', isAdmin, MakeController.getMakeById);

// Create new make
router.post('/makes', isAdmin, MakeController.createMake);

// Update make
router.put('/makes/:id', isAdmin, MakeController.updateMake);

// Delete make
router.delete('/makes/:id', isAdmin, MakeController.deleteMake);

// Bulk delete makes
router.post('/makes/bulk-delete', isAdmin, MakeController.bulkDeleteMakes);

// Bulk update make status
router.post('/makes/bulk-update-status', isAdmin, MakeController.bulkUpdateMakeStatus);


// ==================== CATEGORY ROUTES ====================
// Get all categories (paginated with search)
router.get('/categories', isAdmin, CategoryController.getAllCategories);

// Get active categories (for dropdown)
router.get('/categories/active', isAdmin, CategoryController.getActiveCategories);

// Get category by ID
router.get('/categories/:id', isAdmin, CategoryController.getCategoryById);

// Create new category
router.post('/categories', isAdmin, CategoryController.createCategory);

// Update category
router.put('/categories/:id', isAdmin, CategoryController.updateCategory);

// Delete category
router.delete('/categories/:id', isAdmin, CategoryController.deleteCategory);

// Bulk delete categories
router.post('/categories/bulk-delete', isAdmin, CategoryController.bulkDeleteCategories);

// Bulk update category status
router.post('/categories/bulk-update-status', isAdmin, CategoryController.bulkUpdateCategoryStatus);


// ==================== PRODUCT ROUTES ====================
// Get all products (paginated with search and filters)
router.get('/products', isAdminOrUser, ProductController.getAllProducts);

// Get product by ID (includes images and related products)
router.get('/products/:id', isAdminOrUser, ProductController.getProductById);

// Get products by reference code
router.get('/products/ref/:refCode', isAdmin, ProductController.getProductsByRefCode);

// Create new product
router.post('/products', isAdmin, ProductController.createProduct);

// Update product
router.put('/products/:id', isAdmin, ProductController.updateProduct);

// Delete product
router.delete('/products/:id', isAdmin, ProductController.deleteProduct);

// Bulk delete products
router.post('/products/bulk-delete', isAdmin, ProductController.bulkDeleteProducts);

// Bulk update product status
router.post('/products/bulk-update-status', isAdmin, ProductController.bulkUpdateProductStatus);


// ==================== BULK IMPORT ROUTES ====================
// Download Excel template
router.get('/import/template', BulkImportController.downloadExcelTemplate);

// Validate Excel file (without importing)
router.post('/import/validate', isAdmin, excelUpload.single('file'), BulkImportController.validateExcelFile);

// Bulk import products from Excel
router.post('/import/products', isAdmin, excelUpload.single('file'), BulkImportController.bulkImportProducts);

// Bulk import products from Keyword
router.post('/import/keywords', isAdmin, excelUpload.single('file'), BulkImportController.bulkImportKeywords);

router.post('/images/check-missing', isAdmin, ImageImportController.checkMissingImages);

// Bulk upload images for all products
router.post('/images/bulk-upload', isAdmin, ImageImportController.bulkUploadImages);

// Upload images for specific product codes
router.post('/images/upload-specific', isAdmin, ImageImportController.uploadSpecificImages);

router.get('/images/missing-report', ImageImportController.downloadMissingImagesReport);

router.get('/images/product-image-report', ImageImportController.downloadProductImagesReport);

module.exports = router;
