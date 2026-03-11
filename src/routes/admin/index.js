const express = require('express');
const AuthRoutes = require("./auth");
const DashboardRoutes = require("./dashboard");
const UserRoutes = require("./user");
const ProductRoutes = require("./product");
const EnquiryRoutes = require("./adminEnquiryRoutes");

const router = express.Router();

router.use("/auth", AuthRoutes);
router.use("/dashboard", DashboardRoutes);
router.use("/users", UserRoutes);
router.use("/catalog", ProductRoutes);
router.use("/enquiry", EnquiryRoutes);

module.exports = router;
