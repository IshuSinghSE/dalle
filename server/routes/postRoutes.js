import express from "express";
import * as dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import archiver from "archiver";
import axios from "axios";
// import stream from 'stream';

import Post from "../mongodb/models/post.js";

dotenv.config();

const router = express.Router();

// Middleware to serve static files with caching headers
const oneYear = 365 * 24 * 60 * 60 * 1000; // One year in milliseconds
router.use(
  "/static",
  express.static("public", {
    maxAge: oneYear,
    setHeaders: (res, path) => {
      if (path.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to create folder if it does not exist
const createFolderIfNotExists = async (folderName) => {
  try {
    await cloudinary.api.create_folder(folderName);
  } catch (error) {
    if (error.http_code !== 409) {
      // 409 means the folder already exists
      throw error;
    }
  }
};

// GET ALL POSTS
router.route("/").get(async (req, res) => {
  try {
    const posts = await Post.find({});

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

// CREATE A POST
router.route("/").post(async (req, res) => {
  try {
    const { name, prompt, photo } = req.body;
    const photoUploadResponse = await cloudinary.uploader.upload(photo, {
      folder: "dalle",
    });
    const photoUrl = photoUploadResponse.url;
    const folderName = "dalle";

    // console.log("Cloudinary URL:", photoUrl); // Log the Cloudinary URL

    // Create folders if they do not exist
    await createFolderIfNotExists(`${folderName}/thumbnails`);
    await createFolderIfNotExists(`${folderName}/lowres`);

    const response = await axios.get(photoUrl, {
      responseType: "arraybuffer",
    });

    // console.log("first response", response.data);
    // Create a low-res blurred thumbnail in WebP format
    const thumbnailBuffer = await sharp(response.data)
      .resize(150)
      .blur(10)
      .webp({ quality: 80 }) // Reduce quality to decrease size
      .toBuffer();

    const thumbnailUrl = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `${folderName}/thumbnails`, format: "webp" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(thumbnailBuffer);
    });

    // Create a low-res version of the image in JPEG format
    const lowResBuffer = await sharp(response.data)
      .resize(300, 300) // Maintain good quality resolution
      .jpeg({ quality: 80 }) // Reduce quality to decrease size
      .toBuffer();

    const lowResUrl = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `${folderName}/lowres`, format: "jpeg" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(lowResBuffer);
    });

    const newPost = await Post.create({
      name,
      prompt,
      photo: photoUrl,
      thumbnail: thumbnailUrl.url,
      lowRes: lowResUrl.url,
    });

    res.status(201).json({ success: true, data: newPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

// TEMPORARY ROUTE TO UPDATE THUMBNAILS AND LOW-RES IMAGES
router.route("/temp").get(async (req, res) => {
  try {
    const posts = await Post.find({});

    const modifiedPosts = await Promise.all(
      posts.map(async (post) => {
        try {
          const folderPath = post.photo.split("/").slice(0, -1).join("/"); // Get the unique folder path
          const folderName = "dalle";

          // Create folders if they do not exist
          await createFolderIfNotExists(`${folderPath}/thumbnails`);
          await createFolderIfNotExists(`${folderPath}/lowres`);

          const response = await axios.get(post.photo, {
            responseType: "arraybuffer",
          });

          // Create a low-res blurred thumbnail in WebP format
          const thumbnailBuffer = await sharp(response.data)
            .resize(150)
            .blur(10)
            .webp({ quality: 80 }) // Reduce quality to decrease size
            .toBuffer();

          const thumbnailUrl = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: `${folderName}/thumbnails`, format: "webp" },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            uploadStream.end(thumbnailBuffer);
          });

          // Create a low-res version of the image in JPEG format
          const lowResBuffer = await sharp(response.data)
            .resize(300, 300) // Maintain good quality resolution
            .jpeg({ quality: 80 }) // Reduce quality to decrease size
            .toBuffer();

          const lowResUrl = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: `${folderName}/lowres`, format: "jpeg" },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            uploadStream.end(lowResBuffer);
          });

          post.thumbnail = thumbnailUrl.url;
          post.lowRes = lowResUrl.url;
          await post.save();
          return {
            ...post._doc,
            thumbnail: thumbnailUrl.url,
            lowRes: lowResUrl.url,
          };
        } catch (error) {
          console.error(`Error processing post ${post._id}: ${error.message}`);
          return null; // Skip this post and move to the next one
        }
      })
    );

    // Filter out null values (posts that were skipped)
    const filteredPosts = modifiedPosts.filter((post) => post !== null);

    res.status(200).json({ success: true, data: filteredPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

// ROUTE TO UPDATE ALL POSTS WITH EMPTY LOWRES AND THUMBNAIL FIELDS
router.route("/update-fields").get(async (req, res) => {
  try {
    const posts = await Post.updateMany(
      {},
      { $set: { lowRes: "", thumbnail: "" } }
    );

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

// DOWNLOAD ALL IMAGES FROM DALLE FOLDER AS ZIP
router.route("/download").get(async (req, res) => {
  try {
    const { resources } = await cloudinary.search
      .expression("folder:dalle")
      .execute();

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    res.attachment("dalle-images.zip");
    archive.pipe(res);

    for (const resource of resources) {
      try {
        const response = await axios.get(resource.url, {
          responseType: "stream",
        });
        const extension = resource.format; // Get the file extension
        const fileName = `${resource.public_id.split("/").pop()}.${extension}`;
        archive.append(response.data, { name: fileName });
      } catch (error) {
        console.error(
          `Error downloading resource ${resource.public_id}: ${error.message}`
        );
      }
    }

    await archive.finalize();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
