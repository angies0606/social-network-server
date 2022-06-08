import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import {upload, gfs} from './images.js';
import './db.js';
import { CommentModel, LikeModel, PostModel, UserModel } from './db.js';
import authRoutes from '#routes/auth.routes.js';
import userRoutes from '#routes/user.routes.js';
import mongoose from 'mongoose';
import {verifyAccess} from '#utils/auth.utils.js';

const app = express();
const corsOptions = {
  origin: ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get('/posts/:userId', verifyAccess, async (req, res, next) => {
  try {
    const {authedUser} = res.locals;
    const posts = await PostModel.find({user: req.params.userId}).sort({createdAt: -1}).exec();

    const postsWithData = await Promise.all(posts.map(post => {
      return Promise.all(
        [
          LikeModel.findOne({user: authedUser._id, post: post._id}).exec().then(like => {
            return Boolean(like);
          }),
          LikeModel.find({post: post._id}).exec().then(likes => {
            return likes.length;
          }),
          CommentModel.find({post: post._id}).exec().then(comments => {
            return comments.length;
          }),
          // CommentModel.find({post: post._id}).exec().then(comments => {
          //   return comments.map(comment => {
          //     return comment._id
          //   });
          // }),
        ]
      ).then(([isLiked, nLikes, nComments]) => {
        return {
          ...post.toObject(),
          isLiked,
          nLikes,
          nComments
        }
      })
    }))

    res.status(200).json(postsWithData);
  } catch (e) {
    next(e);
  }
});

app.post('/posts', async (req, res) => {
  const post = new PostModel({
    user: req.body.user,
    createdAt: req.body.createdAt,
    text: req.body.text,
    image: req.body.image
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
app.delete('/posts/:postId', async(req, res) => {
  const post = await PostModel.findByIdAndDelete(req.params.postId).exec();
  const likes = await LikeModel.deleteMany({post: req.params.postId}).exec();
  const comments = await CommentModel.deleteMany({post: req.params.postId}).exec();
  const imageUrl = post.image;
  if(imageUrl) {
    const imageUrlArr = imageUrl.split('/');
    const imageId = imageUrlArr[imageUrlArr.length - 2];
    gfs.delete(new mongoose.Types.ObjectId(imageId));
  }
  res.status(200).json(post._id);
})

app.post('/posts/:postId/like', verifyAccess, async(req, res) => {
  const {authedUser} = res.locals;
  const like = new LikeModel({user: authedUser._id, post: req.params.postId});
  await like.save();
  const post = await PostModel.findById(req.params.postId).exec();
  const nLikes = await LikeModel.find({post: post._id}).exec();
  console.log(nLikes)
  const likedPost = {
    ...post._doc,
    isLiked: true,
    nLikes: nLikes.length
  }
  res.status(200).json(likedPost);
})

app.delete('/posts/:postId/like', verifyAccess, async(req, res) => {
  const {authedUser} = res.locals;
  const like = await LikeModel.findOneAndDelete({user: authedUser._id, post: req.params.postId}).exec();
  console.log(like)
  const post = await PostModel.findById(req.params.postId).exec();
  const nLikes = await LikeModel.find({post: post._id}).exec();
  const unlikedPost = {
    ...post.toObject(),
    isLiked: false,
    nLikes: nLikes.length
  }

  console.log(post)
  res.status(200).json(unlikedPost);
})

app.post('/posts/:postId/comment', async(req, res) => {
 let commentsData = new CommentModel({
    user: req.body.userId,
    post: req.params.postId,
    text: req.body.text
  })
  await commentsData.save();
  const user = await UserModel.findById(commentsData.user).exec();
  commentsData = {
    ...commentsData._doc,
    userAvatar: user.avatar,
    userNickname: user.nickname
  }

  const comments = await CommentModel.find({post: req.params.postId}).exec();
  const nComments = comments.length;

  res.status(200).json({commentsData: [commentsData], nComments});
})

app.get('/posts/:postId/comments', async (req, res) => {
  const receivedComments = await CommentModel.find({post: req.params.postId}).sort({createdAt: 1}).exec();
  // console.log(comments);
  const commentsData = await Promise.all(receivedComments.map(comment => {
    return UserModel.findById(comment.user).exec().then(user => {
      return {
        ...comment._doc,
        userAvatar: user.avatar,
        userNickname: user.nickname
      };
    });
  }));

  const nComments = commentsData.length;

  // let commentsWithAvatars = comments.map(comment => {
  //   const user = await UserModel.findById(comment.user).exec();
  //   return {
  //     ...comment._doc,
  //     userAvatar: user.avatar
  //   }
  // })
  // `console.log(commentsWithAvatars);`
  res.status(200).json({commentsData, nComments});
})

app.delete('/comments/:id', async (req, res) => {
  const deletedComment = await CommentModel.findByIdAndDelete(req.params.id).exec();
  const comments = await CommentModel.find({post: deletedComment.post}).exec();
  const nComments = comments.length;
  res.status(200).json({deletedComment, nComments});
})

app.delete('/posts/:postId/image', async (req, res, next) => {
  try {
    const post = await PostModel.findById(req.params.postId).exec();
    const imageUrl = post.image;
    console.log(imageUrl);
    const imageUrlArr = imageUrl.split('/');
    console.log(imageUrlArr);
    const imageId = imageUrlArr[imageUrlArr.length - 2];
    gfs.delete(new mongoose.Types.ObjectId(imageId));
    const newPost = await PostModel.findByIdAndUpdate(req.params.postId, {
      image: ''
    },{new: true}).exec();
    res.status(200).json(newPost);
  }
  catch (e) {
    next(e);
  }
})

app.post('/images', upload.single('img'), (req, res) => {
  // console.log(req.file)
  const fileId = req.file.id.toString();
  const fileName = req.file.filename;
  res.status(201).send({
    imageUrl: `${req.protocol}://${req.hostname}:${process.env.PORT}/images/${fileId}/${fileName}`
  })
  // console.log(res);
})

app.get('/images/:fileId/:filename', (req, res) => {
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
})

authRoutes(app);
userRoutes(app);

app.listen(process.env.PORT, () => {
  console.log(`Server started at port ${process.env.PORT}`);
});

export default app;