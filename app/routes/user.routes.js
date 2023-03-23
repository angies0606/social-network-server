import mongoose from "mongoose";
import {upload, gfs} from "../images.js";
import { UserModel } from "#app/db.js";
import {verifyAccess} from "#utils/auth.utils.js";
import { PaginationParameters } from "mongoose-paginate-v2";
import {getImageUrl} from '#utils/image.utils.js';

export default function (app) {
  app.get('/users', verifyAccess, async (req, res, next) => {
    try {
      const [query, options] = new PaginationParameters(req).get();
      const paginateResult = await UserModel.paginate(query, options);
      console.log(paginateResult)
      const users = paginateResult.docs || [];
      res.status(200).json({
        items: users,
        hasNextPage: paginateResult.hasNextPage
      });
    }
    catch (e) {
      next(e);
    }
  });

  app.get('/users/:id', verifyAccess, async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.params.id).exec();
      res.status(200).json(user);
    } 
    catch (e) {
      next(e);
    }
  });

  //TODO: написать код, который общий для запроса для аватара и баннера
  app.post('/user/avatar', upload.single('img'), verifyAccess, async (req, res, next) => {
    try {
      const {authedUser} = res.locals;
      const fileId = req.file.id.toString();
      const fileName = req.file.filename;
      const imageUrl = getImageUrl(req, fileId, fileName);
      const user = await UserModel.findById(authedUser._id).exec();
      const userAvatar = user.avatar;
      const updatedUser = await UserModel.findByIdAndUpdate(authedUser._id, {
        avatar: imageUrl
      },{new: true}).exec();

      if(userAvatar) {
        const oldImageUrlArr = userAvatar.split('/');
        const oldImageId = oldImageUrlArr[oldImageUrlArr.length - 2];
        gfs.delete(new mongoose.Types.ObjectId(oldImageId));
      }
      res.status(200).json(updatedUser);
    } catch (e) {
      next(e);
    }
  });

  app.post('/user/banner', upload.single('img'), verifyAccess, async (req, res, next) => {
    try {
      const {authedUser} = res.locals;
      const fileId = req.file.id.toString();
      const fileName = req.file.filename;
      const imageUrl = getImageUrl(req, fileId, fileName);
      const user = await UserModel.findById(authedUser._id).exec();
      const userBanner = user.banner;
    
      const updatedUser = await UserModel.findByIdAndUpdate(authedUser._id, {
        banner: imageUrl
      },{new: true}).exec();

      if(userBanner) {
        const oldImageUrlArr = userBanner.split('/');
        const oldImageId = oldImageUrlArr[oldImageUrlArr.length - 2];
        gfs.delete(new mongoose.Types.ObjectId(oldImageId));
      }
      
      res.status(200).json(updatedUser);
    } catch (e) {
      next(e);
    }
  });

  app.delete('/user/avatar', verifyAccess, async (req, res, next) => {
    try {
      const {authedUser} = res.locals;
      const imageUrl = req.body.avatar;
      const imageUrlArr = imageUrl.split('/');
      const imageId = imageUrlArr[imageUrlArr.length - 2];
      gfs.delete(new mongoose.Types.ObjectId(imageId));
      const updatedUser = await UserModel.findByIdAndUpdate(authedUser._id, {
        avatar: ''
      },{new: true}).exec();
      
      res.status(200).json(updatedUser);
    } catch (e) {
      next(e);
    }
  })

  app.delete('/user/banner', verifyAccess, async (req, res, next) => {
    try {
      const {authedUser} = res.locals;
      const imageUrl = req.body.banner;
      const imageUrlArr = imageUrl.split('/');
      const imageId = imageUrlArr[imageUrlArr.length - 2];
      gfs.delete(new mongoose.Types.ObjectId(imageId));
      const updatedUser = await UserModel.findByIdAndUpdate(authedUser._id, {
        banner: ''
      },{new: true}).exec();
      
      res.status(200).json(updatedUser);
    } catch (e) {
      next(e);
    }
  })
}