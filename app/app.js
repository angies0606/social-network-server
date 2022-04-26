import express from 'express';
import cors from 'cors';
import {upload, gfs} from './images.js';
import './db.js';
import { CommentModel, LikeModel, PostModel, UserModel } from './db.js';
import authRoutes from '#routes/auth.routes.js';
import userRoutes from '#routes/user.routes.js';

const app = express();
const corsOptions = {
  origin: ['http://localhost:3000'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());



app.get('/posts', async (req, res) => {
  const posts = await PostModel.find({});
  res.status(200).json(posts);
});
app.post('/posts', async (req, res) => {
  const post = new PostModel({
    user: req.body.user,
    createdAt: req.body.createdAt,
    text: req.body.text,
    image: req.body.image,
    likes: [],
    comments: []
  });
  await post.save();
  res.status(200).json(post);
});
app.patch('/posts/:id', async (req, res) => {
  const post = await PostModel.findByIdAndUpdate(req.params.id, {
    text: req.body.text,
    image: req.body.image
  },{new: true}).exec();
  res.status(200).json(post);

})
app.delete('/posts/:id', async(req, res) => {
  const post = await PostModel.findByIdAndDelete(req.params.id).exec();
  res.status(200).json(post);
})

app.post('/posts/:id/like', async(req, res) => {
  const like = new LikeModel({user: req.body.userId});
  await like.save();
  const post = await PostModel.findById(req.params.id).exec();
  await post.update({
    likes: [
      ...post.likes,
      like._id
    ]
  })
  res.status(200).json({like, post});
})

app.post('/posts/:id/comment', async(req, res) => {
  const comment = new CommentModel({
    user: req.body.userId,
    post: req.params.id,
    text: req.body.text
  })
  await comment.save();
  res.status(200).json(comment);
})

app.get('/posts/:id/comments', async (req, res) => {
  const comments = await CommentModel.find({post: req.params.id}).exec();
  res.status(200).json(comments);
})

app.delete('/comments/:id', async (req, res) => {
  const comment = await CommentModel.findByIdAndDelete(req.params.id).exec();
  res.status(200).json(comment);
})

app.post('/images', upload.single('img'), (req, res) => {
  console.log(req.file)
  res.status(201).send({
    imageUrl: `${req.protocol}://${req.hostname}:${process.env.PORT}/images/${req.file.filename}`
  })
})

app.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;

  gfs.find({ filename }).toArray((err, files) => {
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
})

authRoutes(app);
userRoutes(app);

app.listen(process.env.PORT, () => {
  console.log(`Server started at port ${process.env.PORT}`);
});

export default app;