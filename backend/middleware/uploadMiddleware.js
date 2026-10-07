import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
['uploads/reports', 'uploads/proofs'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const makeStorage = (folder) => multer.diskStorage({
    destination(req, file, cb) {
        cb(null, folder);
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpg|jpeg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG, WEBP images are allowed'));
    }
};

export const uploadReport = multer({
    storage: makeStorage('uploads/reports'),
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadProof = multer({
    storage: makeStorage('uploads/proofs'),
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
});

// Default export (single file upload for reports)
export default uploadReport;
