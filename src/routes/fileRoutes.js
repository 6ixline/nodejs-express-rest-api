const express = require('express');
const upload = require('../config/multer');
const { singleFileUpload, multipleFileUpload } = require('../controllers/fileController');
const isAdminOrUser = require('../middlewares/isAdminOrUser');

const router = express.Router();

// Single file upload
router.post('/upload/single/:ownerType', isAdminOrUser, upload.single('file'), singleFileUpload);

// Multiple files upload
router.post('/upload/multiple/:ownerType', isAdminOrUser, upload.array('file', 10), multipleFileUpload);

module.exports = router;