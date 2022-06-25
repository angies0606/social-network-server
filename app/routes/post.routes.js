import mongoose from "mongoose";
import { gfs } from "../images.js";
import { verifyAccess } from "#utils/auth.utils.js";
import { UserModel, PostModel, CommentModel, LikeModel } from "#app/db.js";
import { PaginationParameters } from 'mongoose-paginate-v2';

export default function (app) {
  app.get('/posts/:userId', verifyAccess, async (req, res, next) => {
    try {
      const {authedUser} = res.locals;
      const {userId} = req.params;

      // const posts = await PostModel.find({user: req.params.userId}).sort({createdAt: -1}).exec();
      const [query, options] = new PaginationParameters(req).get();
      query.user = userId;
      const paginateResult = await PostModel.paginate(query, options);
      // console.log(paginateResult)
      const posts = paginateResult.docs || [];

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
  
      res.status(200).json({
        items: postsWithData,
        hasNextPage: paginateResult.hasNextPage
      });
    } catch (e) {
      next(e);
    }
  })
  
  app.post('/posts', verifyAccess, async (req, res) => {
    try {
      const {authedUser} = res.locals;
      const post = new PostModel({
        user: authedUser._id,
        createdAt: req.body.createdAt,
        text: req.body.text,
        image: req.body.image
      });
      await post.save();
      res.status(200).json(post);
    }
    catch (e) {
  
    }
  })
  
  app.patch('/posts/:id', verifyAccess, async (req, res) => {
    try {
      const post = await PostModel.findByIdAndUpdate(req.params.id, {
        text: req.body.text,
        image: req.body.image
      },{new: true}).exec();
      res.status(200).json(post);
    }
    catch (e) {
  
    }
  })
  
  app.delete('/posts/:postId', verifyAccess, async(req, res) => {
    try {
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
    }
    catch (e) {
  
    }
  })
  
  app.post('/posts/:postId/like', verifyAccess, async(req, res) => {
    try {
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
    }
    catch (e) {
  
    }
  })
  
  app.delete('/posts/:postId/like', verifyAccess, async(req, res) => {
    try {
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
    
      res.status(200).json(unlikedPost);
    }
    catch (e) {
  
    }
  })
  
  app.post('/posts/:postId/comment', verifyAccess, async(req, res) => {
    try {
      const {authedUser} = res.locals;
  
      let commentsData = new CommentModel({
        user: authedUser._id,
        post: req.params.postId,
        text: req.body.text
       });
  
       await commentsData.save();
       const user = await UserModel.findById(commentsData.user).exec();
       commentsData = {
         ...commentsData._doc,
         userAvatar: user.avatar,
         userNickname: user.nickname
       };
     
       const comments = await CommentModel.find({post: req.params.postId}).exec();
       const nComments = comments.length;
     
       res.status(200).json({commentsData: [commentsData], nComments});
    }
    catch (e) {
  
    }
   })
  
  app.get('/posts/:postId/comments', verifyAccess, async (req, res) => {
    try {
      const receivedComments = await CommentModel.find({post: req.params.postId}).sort({createdAt: 1}).exec();
    
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
    
      res.status(200).json({commentsData, nComments});
    }
    catch (e) {
  
    }
  })
  
  app.delete('/comments/:id', verifyAccess, async (req, res) => {
    try {
      const deletedComment = await CommentModel.findByIdAndDelete(req.params.id).exec();
      const comments = await CommentModel.find({post: deletedComment.post}).exec();
      const nComments = comments.length;
      res.status(200).json({deletedComment, nComments});
    }
    catch (e) {
  
    }
  })
  
  app.delete('/posts/:postId/image', verifyAccess, async (req, res, next) => {
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
}










