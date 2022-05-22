import { UserModel } from '#app/db.js';
import {upload, gfs} from '../images.js';
import mongoose from 'mongoose';

export default function (app) {
  app.get('/users', async (req, res) => {
    const users = await UserModel.find({});
    res.status(200).json(users);
  });

  app.get('/users/:id', async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.params.id).exec();
      res.status(200).json(user);
    } catch (e) {
      next(e);
    }
  });

  app.post('/users', async (req, res) => {
    const user = new UserModel({
      name: req.body.name,
      nickname: req.body.nickname,
      avatar: '',
      banner: ''
    });
    await user.save();
    res.status(200).json(user);
  });

  //TODO: написать код, который общий для запроса для аватара и баннера
  app.post('/user/:userId/avatar', upload.single('img'), async (req, res, next) => {
    try {
      const fileId = req.file.id.toString();
      const fileName = req.file.filename;
      const imageUrl = `${req.protocol}://${req.hostname}:${process.env.PORT}/images/${fileId}/${fileName}`;
      const user = await UserModel.findById(req.params.userId).exec();
      const userAvatar = user.avatar;
      const newUser = await UserModel.findByIdAndUpdate(req.params.userId, {
        avatar: imageUrl
      },{new: true}).exec();
      if(userAvatar !== '') {
        const oldImageUrlArr = userAvatar.split('/');
        const oldImageId = oldImageUrlArr[oldImageUrlArr.length - 2];
        gfs.delete(new mongoose.Types.ObjectId(oldImageId));
      }
      res.status(200).json(newUser);
    } catch (e) {
      next(e);
    }
  });

  app.post('/user/:userId/banner', upload.single('img'), async (req, res, next) => {
    try {
      const fileId = req.file.id.toString();
      const fileName = req.file.filename;
      const imageUrl = `${req.protocol}://${req.hostname}:${process.env.PORT}/images/${fileId}/${fileName}`;
      const user = await UserModel.findById(req.params.userId).exec();
      const userBanner = user.banner;
    
      const newUser = await UserModel.findByIdAndUpdate(req.params.userId, {
        banner: imageUrl
      },{new: true}).exec();

      if(userBanner !== '') {
        const oldImageUrlArr = userBanner.split('/');
        const oldImageId = oldImageUrlArr[oldImageUrlArr.length - 2];
        gfs.delete(new mongoose.Types.ObjectId(oldImageId));
      }
      
      res.status(200).json(newUser);
    } catch (e) {
      next(e);
    }
  });

  // app.post('/images', upload.single('img'), (req, res) => {
  //   // console.log(req.file)
  //   const fileId = req.file.id.toString();
  //   const fileName = req.file.filename;
  //   res.status(201).send({
  //     imageUrl: `${req.protocol}://${req.hostname}:${process.env.PORT}/images/${fileId}/${fileName}`
  //   })
  //   // console.log(res);
  // })
}