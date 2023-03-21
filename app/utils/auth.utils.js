import jwt from "jsonwebtoken";
import {UserModel} from "#app/db.js";
import {IS_PRODUCTION} from "#app/environment.js";

export async function verifyAccess(req, res, next) {
  try {
    const accessToken = req.cookies?.[process.env.ACCESS_TOKEN_COOKIE_NAME];

    if (!accessToken) {
      throw new Error();
    }

    const {userId} = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY);

    if (!userId) {
      throw new Error();
    }

    const user = await UserModel.findById(userId).exec();

    if (!user) {
      throw new Error();
    }

    res.locals.authedUser = user;

    next();
  }
  catch (e) {
    const error = new Error('Пользователь не найден');
    console.log(error)
    cleanAuthCookies(res);
    res.status(401).json(error);
  }
}

export function cleanAuthCookies(res) {
  res.cookie(process.env.ACCESS_TOKEN_COOKIE_NAME, null, {
    maxAge: null,
    secure: IS_PRODUCTION,
    httpOnly: false,
    sameSite: false
  });
  res.cookie(process.env.REFRESH_TOKEN_COOKIE_NAME, null, {
    maxAge: null,
    secure: IS_PRODUCTION,
    httpOnly: false,
    sameSite: false
  });
}