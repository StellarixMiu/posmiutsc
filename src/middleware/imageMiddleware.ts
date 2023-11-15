import multer from "multer";
import { Request } from "express";

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "public/images/");
  },
  filename: (req, file, callback) => {
    const date = new Date();
    callback(null, `${date.getTime()}.webp`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: async (
    req: Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback
  ) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(null, false);
    }
    callback(null, true);
  },
});

export default upload;
