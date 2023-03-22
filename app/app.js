import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./db.js";
import authRoutes from "#routes/auth.routes.js";
import userRoutes from "#routes/user.routes.js";
import postRoutes from "#routes/post.routes.js";
import imageRoutes from "#routes/image.routes.js";

const app = express();
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://angies0606.github.io'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

authRoutes(app);
userRoutes(app);
postRoutes(app);
imageRoutes(app);

app.listen(process.env.PORT, () => {
  console.log(`Server started at port ${process.env.PORT}`);
});

export default app;