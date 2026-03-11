const { User, Product, Enquiry } = require("../models");

const getDashboardStats = async (id) => {
    try {
      const dealerCount = await User.count({ where: { role: 'normal' } });
      const internalCount = await User.count({ where: { role: 'internal' } });
      const productCount = await Product.count();
      const enquiryCount = await Enquiry.count();
      return { dealerCount, internalCount, productCount, enquiryCount };
    } catch (err) {
      throw new Error(err.message);
    }
};

module.exports = {
    getDashboardStats
}