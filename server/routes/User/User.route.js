const User = require("../../models/User/User.model");
const userRouter = require("express").Router();
const multerUpload = require("../../middlewares/multer.middleware");
const { StatusCodes } = require("http-status-codes");
const isAuthenticated = require("../../middlewares/isAuthenticated.middleware");
const { userCache, socketCache } = require("../../redis/redis");
userRouter.get("/", isAuthenticated, async (req, res) => {
  logger = req.logger;
  logger.info("Getting user details");
  let user = req.user;
  delete user.password;
  delete user._id;
  logger.info("User details: " + JSON.stringify(user));
  res.send(user);
});

userRouter.get("/:username/checkOnline", isAuthenticated, async(req, res)=>{
  const usernameToCheck = req.params.username;
  const exists = await socketCache.exists(usernameToCheck);
  res.send({status: exists});
})

userRouter.get("/about", isAuthenticated, async (req, res) => {
  const logger = req.logger;
  User.findById(req.user._id)
    .select("-password -_id")
    .populate({
      path: "friends",
      select: "-friends -password -_id",
    })
    .exec()
    .then((user) => {
      if (!user) {
        logger.error("User not found");
        return res
          .send({ message: "User not found" })
          .status(StatusCodes.NOT_FOUND);
      }
      delete user.password;
      delete user._id;
      logger.info("Got the user: " + user);
      return res.send(JSON.stringify(user));
    })
    .catch((error) => {
      logger.error("Error in getting user details: " + error);
      return res
        .send({ message: "Error in getting user details" })
        .status(StatusCodes.INTERNAL_SERVER_ERROR);
    });
});

userRouter.post(
  "/image",
  [isAuthenticated, multerUpload.single("image")],
  async (req, res) => {
    const logger = req.logger;
    const userId = req.user._id;
    logger.info("Going to upload image for user: " + userId);
    logger.info("File details: " + req.file);
    if (req.file === undefined) {
      logger.error("No file uploaded");
      return res
        .send({ message: "No file uploaded" })
        .status(StatusCodes.BAD_REQUEST);
    }
    req.user.image = req.file.path;
    User.findByIdAndUpdate(userId, { image: req.file.path })
      .then((user) => {
        logger.info("Successfully updated the profile picture");
        logger.info("User: " + JSON.stringify(user));
        logger.info(
          "Going to delete user object from cache for: " + req.user.username
        );
        userCache.del(req.user.username);
        res.send({
          message: "Successfully updated the profile picture",
          image: req.file.path,
        });
      })
      .catch((error) => {
        logger.error("Error in uploading profile picture: " + error);
        res
          .send({ message: "Error in uploading profile picture" })
          .status(StatusCodes.INTERNAL_SERVER_ERROR);
      });
  }
);

module.exports = userRouter;
