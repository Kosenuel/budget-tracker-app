const multer = require('multer');
const path = require('path');

// Configure memory storage (good for smaller files, avoids disk writes)
const storage = multer.memoryStorage();

// File filter to accept only CSV
const fileFilter = (req, file, cb) => {
    const filetypes = /csv/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error("Error: File upload only supports CSV format."), false);
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB limit

// --- Specific Uploaders ---
const uploadTransactionCsv = multer({ storage, limits, fileFilter }).single('transactionCsv');
const uploadAccountCsv = multer({ storage, limits, fileFilter }).single('accountCsv'); 

module.exports = {
    uploadTransactionCsv,
    uploadAccountCsv // <<< Export the new instance
};