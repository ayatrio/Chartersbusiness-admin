const cloudinary = require('../config/cloudinary.config');
const { Readable } = require('stream');


// ==========================================
// Upload File To Cloudinary
// ==========================================

const uploadToCloudinary = (
  fileBuffer,
  {
    folder = 'charters-business',
    publicId,
    resourceType = 'auto',
    tags = [],
  } = {}
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        access_mode: 'public',
        tags,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          originalName: result.original_filename,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};


// ==========================================
// Resume Upload Helper
// ==========================================

const uploadResume = async (fileBuffer, userId) => {
  return uploadToCloudinary(fileBuffer, {
    folder: 'charters-business/resumes',
    publicId: `resume-${userId}-${Date.now()}`,
    resourceType: 'raw',
    tags: ['resume', 'job-application'],
  });
};


// ==========================================
// Admission Document Upload Helper
// ==========================================

const uploadAdmissionDocument = async (
  fileBuffer,
  documentType,
  userId
) => {
  const folderMap = {
    photoId: 'charters-business/admissions/photo-ids',
    marksheet: 'charters-business/admissions/marksheets',
    photo: 'charters-business/admissions/photos',
    workProof: 'charters-business/admissions/work-proofs',
  };

  const imageDocuments = ['photo'];

  return uploadToCloudinary(fileBuffer, {
    folder:
      folderMap[documentType] ||
      'charters-business/admissions/others',

    publicId: `${documentType}-${userId}-${Date.now()}`,

    resourceType: imageDocuments.includes(documentType)
      ? 'image'
      : 'auto',

    tags: ['admission-document', documentType],
  });
};


// ==========================================
// Delete File From Cloudinary
// ==========================================

const deleteFromCloudinary = async (
  publicId,
  resourceType = 'auto'
) => {
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    throw error;
  }
};


// ==========================================
// Generate Cloudinary URL
// ==========================================

const getCloudinaryUrl = (
  publicId,
  options = {}
) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
};


// ==========================================
// Extract Public ID From URL
// ==========================================

const extractPublicId = (url) => {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    const uploadIndex = url.indexOf('/upload/');

    if (uploadIndex === -1) {
      return null;
    }

    let publicId = url.substring(uploadIndex + 8);

    // Remove version if exists
    publicId = publicId.replace(/^v\d+\//, '');

    // Remove extension
    publicId = publicId.replace(/\.[^/.]+$/, '');

    return publicId;
  } catch (error) {
    console.error('Extract Public ID Error:', error);
    return null;
  }
};


module.exports = {
  uploadToCloudinary,
  uploadResume,
  uploadAdmissionDocument,
  deleteFromCloudinary,
  getCloudinaryUrl,
  extractPublicId,
};