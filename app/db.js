import mongoose from 'mongoose';

mongoose.connect(process.env.DB_ADDRESS);

const UserSchema = mongoose.Schema({
  name: {
    type: String
  },
  nickname: {
    type: String
  }
});

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
}, { timestamps: true })

const LikeSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }
})

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
  likes: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'like'
      }
    ]
  },
  comments: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comment'
      }
    ]
  },
  
}, { timestamps: true })

const PasswordSchema = mongoose.Schema({
  password: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }
})

export const UserModel = mongoose.model('user', UserSchema);
export const PostModel = mongoose.model('post', PostSchema);
export const CommentModel = mongoose.model('comment', CommentSchema);
export const LikeModel = mongoose.model('like', LikeSchema);
export const PasswordModel = mongoose.model('password', PasswordSchema);