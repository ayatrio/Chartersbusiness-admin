import cloudinary from "../config/cloudinary.config.js";
import { Readable } from "stream";

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder path
 * @param {string} options.publicId - Public ID for the file
 * @param {string} options.resourceType - Resource type (auto, image, video, raw)
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      folder = "charters-business/resumes",
      publicId,
      resourceType = "raw", // 'raw' for PDFs and other non-image files
    } = options;

    // Create upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        access_mode: "public",
        // Add tags for easier management
        tags: ["resume", "job-application"],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const bufferStream = Readable.from(fileBuffer);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @param {string} resourceType - Resource type (auto, image, video, raw)
 * @returns {Promise<Object>} Cloudinary deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = "raw") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
};

/**
 * Generate a secure URL for a Cloudinary resource
 * @param {string} publicId - The public ID of the file
 * @param {Object} options - Transformation options
 * @returns {string} Secure URL
 */
export const getCloudinaryUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "raw",
    ...options,
  });
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID or null if not a Cloudinary URL
 */
export const extractPublicId = (url) => {
  if (!url || !url.includes("cloudinary.com")) {
    return null;
  }

  try {
    // Extract public ID from URL
    // Format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{transformations}/{public_id}.{format}
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    const pathParts = parts[1].split("/");
    // Remove transformations if present (they don't contain folder names)
    const publicIdParts = pathParts.filter(
      (part) => !part.startsWith("v") && !part.includes("_")
    );

    // Join and remove file extension
    const publicIdWithExt = publicIdParts.join("/");
    const publicId =
      publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf(".")) ||
      publicIdWithExt;

    return publicId;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};
