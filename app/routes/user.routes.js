import { UserModel } from '#app/db.js';

export default function (app) {
  app.get('/users', async (req, res) => {
    const users = await UserModel.find({});
    res.status(200).json(users);
  });

  app.get('/users/:id', async (req, res) => {
    const user = await UserModel.findById(req.params.id).exec();
    res.status(200).json(user);
  })

  app.post('/users', async (req, res) => {
    const user = new UserModel({
      name: req.body.name,
      nickname: req.body.nickname
    });
    await user.save();
    res.status(200).json(user);
  });
}