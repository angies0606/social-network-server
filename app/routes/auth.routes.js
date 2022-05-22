import { UserModel, PasswordModel } from '#app/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {IS_PRODUCTION} from '#app/environment.js';
import {cleanAuthCookies, verifyAccess} from '#utils/auth.utils.js';


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
        nickname,
        avatar
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


      // Проверяем логин/пароль

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


      // Генерируем куки для сессии пользователя

      // Генерируем access токен
      const accessTokenExpirationSeconds = Number(process.env.ACCESS_TOKEN_EXPIRATION_SECONDS);
      console.log("accessTokenExpirationSeconds", process.env.ACCESS_TOKEN_EXPIRATION_SECONDS)
      const accessToken = jwt.sign({
        userId: user._id
      }, process.env.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: accessTokenExpirationSeconds
      });
      res.cookie(process.env.ACCESS_TOKEN_COOKIE_NAME, accessToken, {
        maxAge: accessTokenExpirationSeconds * 1000,
        secure: IS_PRODUCTION,
        httpOnly: true,
        sameSite: true
      });

      // Генерируем refresh токен
      const refreshTokenExpirationSeconds = Number(process.env.REFRESH_TOKEN_EXPIRATION_SECONDS);
      const refreshToken = jwt.sign({
        userId: user._id
      }, process.env.REFRESH_TOKEN_SECRET_KEY, {
        expiresIn: refreshTokenExpirationSeconds
      });
      res.cookie(process.env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        maxAge: refreshTokenExpirationSeconds * 1000,
        secure: IS_PRODUCTION,
        httpOnly: true,
        sameSite: true
      });

      // Отправка ответа
      res.status(200).json(user);
    }
    catch (e) {
      console.log(e)
      res.status(400).json(e);
    }
  });

  app.post('/auth/logout', verifyAccess, async (req, res) => {
    // Очищаем куки
    cleanAuthCookies(res);
    res.status(200).json({success: true});
  });

  app.post('/auth/me', verifyAccess, async (req, res) => {
    try {
      const {authedUser} = res.locals;

      res.status(200).json(authedUser);
    }
    catch (e) {
      console.log(e)
      cleanAuthCookies(res);
      res.status(400).json(e);
    }
  })

 // app.post('/auth/refresh', async (req, res) => {
  //   try {
  //     const {_id: userId} = readRefreshCookie(req)
  //     console.log('USER ID: ', userId)

  //     if (!userId) {
  //       throw new Error()
  //     }
  //     // verifying if we have twitter access token. If YES, then we generate new jwt tokens
  //     const twitterAccessToken = await getUserTwitterOauthAccessToken(userId)

  //     if (!twitterAccessToken) {
  //       await clearUserTwitterOauthAccessToken(userId)

  //       throw new Error()
  //     }

  //     // await TwitterOauthAccessTokenModel.findOneAndUpdate({_id: twitter_oauth_access_token}, {expireAt: moment().add(parseInt(ACCESS_EXPIRATION_SECONDS), 'seconds')}).exec()

  //     generateSessionCookies(res, userId)

  //     res.json({success: true})
  //     return

  //   } catch (e) {
  //     console.log(e)
  //     clearSessionCookies(res)
  //     res.status(401).json({message: 'Session expired'})
  //   }
  // })
} 