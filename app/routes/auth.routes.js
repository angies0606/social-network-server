import { UserModel, PasswordModel } from '#app/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {IS_PRODUCTION} from '#app/environment.js';

function cleanAuthCookies(res) {
  res.cookie(process.env.ACCESS_TOKEN_COOKIE_NAME, null, {
    maxAge: null,
    secure: IS_PRODUCTION,
    httpOnly: true,
    sameSite: true
  });
}

export default function (app) {
  app.post('/auth/register', async (req, res) => {
    try {
      const {name, nickname, password} = req.body;
      if(!(name && nickname && password)) {
        throw new Error('Нужно заполнить все поля');
      }

      const existingUser = await UserModel.findOne({nickname});
      if(existingUser) {
        throw new Error('Пользователь с таким никнеймом уже есть');
      }

      const user = await UserModel.create({
        name,
        nickname
      })

      const encryptedPassword = await bcrypt.hash(password, 10);

      await PasswordModel.create({
        password: encryptedPassword,
        user: user._id
      })

      res.status(200).json({success: true});
    } catch (e) {
      console.log(e)
      res.status(400).json(e);
    }
  });

  app.post('/auth/login', async (req, res) => {
    try {
      const {nickname, password} = req.body;
      
      if (!(nickname && password)) {
        res.status(400).json("Нужно заполнить все поля");
      }
      
      const user = await UserModel.findOne({nickname});
      console.log('user: ', user)
      if (!user) {
        throw new Error ('Пользователь не найден');
      }
      const passwordModel = await PasswordModel.findOne({user: user._id});
      console.log(passwordModel)
      if (!passwordModel || !(await bcrypt.compare(password, passwordModel.password))) {
        throw new Error ('Неправильный пароль');
      }

      const accessTokenExrirationSeconds = Number(process.env.ACCESS_TOKEN_EXPIRATION_SECONDS);
      const token = jwt.sign({
        userId: user._id
      }, process.env.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: accessTokenExrirationSeconds
      });

      res.cookie(process.env.ACCESS_TOKEN_COOKIE_NAME, token, {
        maxAge: accessTokenExrirationSeconds * 1000,
        secure: IS_PRODUCTION,
        httpOnly: true,
        sameSite: true
      });
      res.status(200).json(user);
    }
    catch (e) {
      console.log(e)
      res.status(400).json(e);
    }
  });
  // Очищаем куки
  app.post('/auth/logout', async (req, res) => {
    cleanAuthCookies(res);
    res.status(200).json({success: true});
  })

  app.post('/auth/me', async (req, res) => {
    try {
      const accessToken = req.cookies?.[process.env.ACCESS_TOKEN_COOKIE_NAME];

      if (!accessToken) {
        throw new Error('Пользователь не авторизован');
      }

      const {userId} = jwt.verify(accessToken,  process.env.ACCESS_TOKEN_SECRET_KEY);
      console.log('userId: wegwergwgefdn', userId)
      if (!userId) {
        throw new Error('Пользователь не авторизован');
      }

      const user = await UserModel.findById(userId).exec();

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      res.status(200).json(user);
    } 
    catch (e) {
      console.log(e)
      cleanAuthCookies(res);
      res.status(400).json(e);
    }
  })
} 