const mongoose = require("mongoose");
const UserSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: String,
  username: {
    type: String,
    unique: true,
    required: true,
  },
  socketid: String,
  image: String,
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

UserSchema.index({ username: 1, email: 1 });
module.exports = mongoose.model("User", UserSchema);
