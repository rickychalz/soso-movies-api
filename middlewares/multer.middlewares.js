import multer from "multer";
import path from "path";
import * as fs from 'fs/promises';
import sharp from 'sharp';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/temp/');  // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware to process uploaded image
const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const processedImagePath = req.file.path.replace(/\.[^/.]+$/, '') + '-processed.jpg';
    
    await sharp(req.file.path)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toFile(processedImagePath);

    // Delete the original file
    await fs.unlink(req.file.path);
    
    // Update req.file.path to the processed image
    req.file.path = processedImagePath;
    next();
  } catch (error) {
    next(error);
  }
};


const multerConfig = { upload, processImage };
export default multerConfig;