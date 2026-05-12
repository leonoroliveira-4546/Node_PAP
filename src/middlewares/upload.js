const cloudinary = require("../config/cloudinary");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }
});

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "posts" },
      (error, result) => {
        if (error) {
          console.log("CLOUDINARY ERROR:", error);
          return reject(error);
        }
        console.log("RESULT:", result);
        resolve({
            url: result.secure_url,
            public_id: result.public_id
        });
      }
    ).end(fileBuffer);

    console.log("DEPOIS END");
  });
};

module.exports = { upload, uploadToCloudinary };