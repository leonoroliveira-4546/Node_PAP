const cloudinary = require("../config/cloudinary");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }
});

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new Error('Nenhum arquivo enviado para upload.'));
    }

    cloudinary.uploader.upload_stream(
      { folder: "posts", resource_type: 'image' },
      (error, result) => {
        if (error) {
          console.log("CLOUDINARY ERROR:", error);
          return reject(error);
        }

        if (!result || !result.secure_url) {
          return reject(new Error('Falha no upload para Cloudinary.'));
        }

        resolve({
          url: result.secure_url,
          public_id: result.public_id
        });
      }
    ).end(fileBuffer);
  });
};

module.exports = { upload, uploadToCloudinary };