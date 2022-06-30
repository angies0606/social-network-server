import mongoose from "mongoose";
import paginate from 'mongoose-paginate-v2';

mongoose.connect(process.env.DB_ADDRESS);

const UserSchema = mongoose.Schema({
  email: {
    type: String
  },
  nickname: {
    type: String
  },
  avatar: {
    type: String
  },
  banner: {
    type: String
  }
});
UserSchema.plugin(paginate);

const PostSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  text: {
    type: String
  },
  image: {
    type: String
  },
}, { timestamps: true });
PostSchema.plugin(paginate);

const CommentSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  },
  text: {
    type: String
  }
}, { timestamps: true });
CommentSchema.plugin(paginate);

const LikeSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  },
});

const PasswordSchema = mongoose.Schema({
  password: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }
});

export const UserModel = mongoose.model('user', UserSchema);
export const PostModel = mongoose.model('post', PostSchema);
export const CommentModel = mongoose.model('comment', CommentSchema);
export const LikeModel = mongoose.model('like', LikeSchema);
export const PasswordModel = mongoose.model('password', PasswordSchema);