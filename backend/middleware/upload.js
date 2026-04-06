const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    resume: ['.pdf'],
    certificate: ['.pdf', '.jpg', '.jpeg', '.png'],
    profilePicture: ['.jpg', '.jpeg', '.png', '.gif']
  };

  const ext = path.extname(file.originalname).toLowerCase();
  const fieldName = file.fieldname;

  if (allowedTypes[fieldName] && allowedTypes[fieldName].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${fieldName}. Allowed: ${allowedTypes[fieldName].join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = upload;
