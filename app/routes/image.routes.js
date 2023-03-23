import {upload, gfs} from "../images.js";
import {verifyAccess} from "#utils/auth.utils.js";
import {getImageUrl} from "#utils/image.utils.js";

export default function (app) {
  app.post('/images', upload.single('img'), verifyAccess, (req, res) => {
    try {
      const fileId = req.file.id.toString();
      const fileName = req.file.filename;
      const imageUrl = getImageUrl(req, fileId, fileName);
      res.status(201).send({
        imageUrl
      })
    }
    catch (e) {
      next(e);
    }
  })
  
  app.get('/images/:fileId/:filename', verifyAccess, (req, res) => {
    try {
      const filename = req.params.filename;
    
      gfs.find({ filename: filename }).toArray((err, files) => {
        if (!files || files.length === 0 || !files[0]) {
          return res.status(404).json({
            err: 'No file exists',
          })
        }
    
        const file = files[0];
    
        if (['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.contentType)) {
          gfs.openDownloadStreamByName(filename).pipe(res);
        } else {  
          res.status(404).json({
            err: 'Not an image',
          })
        }
      })
    }
    catch (e) {
      next(e);
    }
  })
}