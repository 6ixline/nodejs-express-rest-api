
const { Admin } = require('../models');

// Admin login service
const loginAdmin = async (username, password) => {
  try {
    const admin = await Admin.findOne({ where: { username } });

    if (!admin) {
      throw new Error('Admin not found');
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    return admin;
  } catch (err) {
    throw new Error(err.message);
  }
};

// creating a new admin user
const createAdmin = async (username, displayName, password) => {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ where: { username } });
    if (existingAdmin) {
      throw new Error('Admin already exists');
    }

    // Hash the password before storing it

    const admin = await Admin.create({
      username,
      displayName,
      password,
    });

    return admin;
  } catch (err) {
    throw new Error(err.message);
  }
};

const changePassword = async (id, oldpassword, newpassword) => {
  try {
    const admin = await Admin.findByPk(id);
    
    if (!admin) {
      throw new Error("Admin not found!");
    }

    const isMatch = await admin.comparePassword(oldpassword);

    if (!isMatch) {
      throw new Error("Wrong account credentials!");
    }

    if (!newpassword || newpassword.trim() === "") {
      throw new Error("New password cannot be empty.");
    }

    admin.password = newpassword;
    await admin.save(); 

    return admin;

  } catch (err) {
    throw err;
  }
};



module.exports = {
  loginAdmin,
  createAdmin,
  changePassword
};