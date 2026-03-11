const Admin = require('./adminModel');
const User = require('./userModel');
const Files = require("./fileModel");
const RefreshToken = require("./refreshToken");
const Make = require("./makeModel");
const Category = require("./categoryModel");
const Product = require("./productModel");
const FavoriteProduct = require("./favoriteProductModel");
const OTP = require("./otpModel");
const Enquiry = require("./enquiryModel");

Product.belongsTo(Make, { foreignKey: 'make_id', as: 'make' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });
Product.belongsTo(Admin, { foreignKey: 'updated_by', as: 'updater' });

Make.hasMany(Product, { foreignKey: 'make_id', as: 'products' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

FavoriteProduct.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
FavoriteProduct.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Enquiry.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Enquiry.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Enquiry.belongsTo(Admin, { foreignKey: 'assigned_to', as: 'assignedAdmin' });
Enquiry.belongsTo(Admin, { foreignKey: 'resolved_by', as: 'resolvedByAdmin' });

User.hasMany(Enquiry, { foreignKey: 'user_id', as: 'enquiries' });
Product.hasMany(Enquiry, { foreignKey: 'product_id', as: 'enquiries' });
Admin.hasMany(Enquiry, { foreignKey: 'assigned_to', as: 'assignedEnquiries' });
Admin.hasMany(Enquiry, { foreignKey: 'resolved_by', as: 'resolvedEnquiries' });

module.exports = {
  Admin,
  User,
  Files,
  RefreshToken,
  Make,
  Category,
  Product,
  FavoriteProduct,
  OTP,
  Enquiry
};
