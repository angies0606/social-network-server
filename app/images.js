
import mongoose from 'mongoose';
import multer from 'multer';
import {GridFsStorage} from 'multer-gridfs-storage';

const storage = new GridFsStorage({
  url: process.env.DB_ADDRESS,
  file: (req, file) => {
    const filename = file.originalname;
    const fileInfo = {
      filename: filename,
      bucketName: 'images',
    };
    return fileInfo;
  },
});

export const upload = multer({ storage });


const connect = mongoose.createConnection(process.env.DB_ADDRESS, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

export let gfs;

connect.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(connect.db, {
    bucketName: 'images'
  });
});