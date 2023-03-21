import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cleanAuthCookies, verifyAccess } from "#utils/auth.utils.js";
import { IS_PRODUCTION } from "#app/environment.js";
import { UserModel, PasswordModel } from "#app/db.js";

export default function (app) {
  app.post('/auth/register', async (req, res) => {
    try {
      const {email, nickname, password} = req.body;
      if(!(email && nickname && password)) {
        throw new Error('Нужно заполнить все поля');
      }

      const existingUser = await UserModel.findOne({nickname});
      if(existingUser) {
        throw new Error('Пользователь с таким никнеймом уже есть');
      }

      const user = await UserModel.create({
        email,
        nickname,
        avatar: '',
        banner: ''
      });

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
      const {login, password} = req.body;

      // Проверяем логин/пароль

      if (!(login && password)) {
        res.status(400).json("Нужно заполнить все поля");
      }
      
      const user = await UserModel.findOne({nickname: login}) || await UserModel.findOne({email: login});
      if (!user) {
        throw new Error ('Пользователь не найден');
      }

      const passwordModel = await PasswordModel.findOne({user: user._id});
      if (!passwordModel || !(await bcrypt.compare(password, passwordModel.password))) {
        throw new Error ('Неправильный пароль');
      }

      // Генерируем куки для сессии пользователя
      // Генерируем access токен
      const accessTokenExpirationSeconds = Number(process.env.ACCESS_TOKEN_EXPIRATION_SECONDS);
      const accessToken = jwt.sign({
        userId: user._id
      }, process.env.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: accessTokenExpirationSeconds
      });

      res.cookie(process.env.ACCESS_TOKEN_COOKIE_NAME, accessToken, {
        maxAge: accessTokenExpirationSeconds * 1000,
        secure: IS_PRODUCTION,
        httpOnly: true,
        sameSite: 'Lax'
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
        sameSite: 'Lax'
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
    try {
      // Очищаем куки

      cleanAuthCookies(res);
      res.status(200).json({success: true});
    }
    catch (e) {
      console.log(e)
      cleanAuthCookies(res);
      res.status(400).json(e);
    }
  });

  app.post('/auth/me', verifyAccess, async (req, res) => {
    try {
      const {authedUser} = res.locals;

      res.status(200).json(authedUser);
    }
    catch (e) {
      const error = new Error('Пользователь не найден');
      cleanAuthCookies(res);
      res.status(400).json(error);
    }
  })

  app.post('/auth/refresh', async (req, res) => {
    try {
      const refreshToken = req.cookies?.[process.env.REFRESH_TOKEN_COOKIE_NAME];
      if (!refreshToken) {
        throw new Error();
      }

      const {userId} = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY);
      if (!userId) {
        throw new Error();
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error ('Пользователь не найден');
      }

      const accessTokenExpirationSeconds = Number(process.env.ACCESS_TOKEN_EXPIRATION_SECONDS);
      const accessToken = jwt.sign({
        userId: user._id
      }, process.env.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: accessTokenExpirationSeconds
      });
      res.cookie(process.env.ACCESS_TOKEN_COOKIE_NAME, accessToken, {
        maxAge: accessTokenExpirationSeconds * 1000,
        secure: IS_PRODUCTION,
        httpOnly: true,
        sameSite: 'Lax'
      });
      
      const refreshTokenExpirationSeconds = Number(process.env.REFRESH_TOKEN_EXPIRATION_SECONDS);
      const newRefreshToken = jwt.sign({
        userId: user._id
      }, process.env.REFRESH_TOKEN_SECRET_KEY, {
        expiresIn: refreshTokenExpirationSeconds
      });
      res.cookie(process.env.REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
        maxAge: refreshTokenExpirationSeconds * 1000,
        secure: IS_PRODUCTION,
        httpOnly: true,
        sameSite: 'Lax'
      });

      res.status(200).json({success: true});
    } catch (e) {
      const error = new Error('Пользователь не найден');
      cleanRefreshCookie(res);
      res.status(401).json(error);
    }
  });
}

export function cleanRefreshCookie(res) {
    res.cookie(process.env.REFRESH_TOKEN_COOKIE_NAME, null, {
    maxAge: null,
    secure: IS_PRODUCTION,
    httpOnly: true,
    sameSite: 'Lax'
  });
}