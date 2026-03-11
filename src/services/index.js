const AdminService = require('./adminService');
const DashboardService = require('./dashboardService');
const FileService = require('./fileService');
const UserService = require("./userService");
const MakeService = require('./makeService');
const CategoryService = require('./categoryService');
const ProductService = require('./productService');
const BulkImportService = require('./bulkImportService');
const FavoriteProductService = require('./favoriteProductService');
const EnquiryService = require('./enquiryService');

module.exports = {
  AdminService,
  DashboardService,
  FileService,
  MakeService,
  CategoryService,
  ProductService,
  UserService,
  BulkImportService,
  FavoriteProductService,
  EnquiryService
};