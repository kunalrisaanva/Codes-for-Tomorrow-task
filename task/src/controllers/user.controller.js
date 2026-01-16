import { User } from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynHandler.js";
import jwt from "jsonwebtoken";



const genrateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accesToken = await user.genrateAccessToken();
    const refreshToken = await user.genrateRefreshToken();
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });
    return { accesToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, " Something went wrong refresh and access token ");
  }
};

// register user Api
const registerUser = asyncHandler(async (req, res) => {
  // Logic to register user
  const { email, password, username } = req.body;

  if ([email, password, username].some((fields) => fields?.trim() === "" || undefined)) {
    throw new ApiError(400, "all fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username allready existed");
  }

  const user = await User.create({
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findOne(user._id).select(
    "-password -refreshToken "
  );

  if (!createdUser) {
    throw new ApiError(500, "Somethind wencomt wrong while registering a User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user Created successfully"));
});

// login user Api
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, " email or password is required ");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isMatch = await user.isPasswordCorrect(password);

  if (!isMatch) {
    throw new ApiError(401, " Invlid user credintails ");
  }

  const { refreshToken, accesToken } = await genrateAccessAndRefreshTokens(
    user._id
  );
  //    console.log(refreshToken)
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken "
  );

  const cookieOptions = {
    httpOnly: true, // Makes the cookie inaccessible to JavaScript
    // secure: true, // Sends cookie only over HTTPS
  };

  return res
    .status(200)
    .cookie("accessToken", accesToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          refreshToken,
          accesToken,
        },
        "User logged In Successfully"
      )
    );
});


const refreshToken = asyncHandler(async (req, res) => {


  const inComingrefreshToken = req.cookies.refreshToken;

  if (!inComingrefreshToken) {
    throw new ApiError(401, "Unauthorized")
  }

  const decodedToken = jwt.verify(inComingrefreshToken, process.env.REFRESH_TOKEN_SECRET);

  const user = await User.findById(decodedToken._id);

  if (!user) {
    throw new ApiError(401, "Unauthorized")
  }

  const { refreshToken: newRefreshToken, accesToken } = await genrateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken "
  );

  const cookieOptions = {
    httpOnly: true, // Makes the cookie inaccessible to JavaScript
    // secure: true, // Sends cookie only over HTTPS
  };

  return res
    .status(200)
    .cookie("accessToken", accesToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          refreshToken: newRefreshToken,
          accesToken,
        },
        "User logged In Successfully"
      )
    );

})


export { registerUser, loginUser, refreshToken };
