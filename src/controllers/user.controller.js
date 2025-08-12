import { User } from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynHandler.js";
import { sendMail } from "../utils/email.js";

const genrateAccess = async (userId) => {
  const user = await User.findById(userId);

  const accessToken = await user.genrateAccessToken();

  return accessToken;
};

// register user Api
const registerUser = asyncHandler(async (req, res) => {
  // Logic to register user

  const { firstName, lastName, email, password } = req.body;

  if (
    [firstName, lastName, email, password].some(
      (fields) => fields?.trim() === "" || undefined
    )
  ) {
    throw new ApiError(400, "all fields are required");
  }

  const existedUser = await User.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User with email or username allready existed");
  }

  const user = await User.create({
    firstName,
    email,
    password,
    lastName,
  });

  const createdUser = await User.findOne(user._id).select("-password ");

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

  const accesToken = await genrateAccess(user._id);
  const loggedInUser = await User.findById(user._id).select("-password  ");

  const cookieOptions = {
    httpOnly: true, // Makes the cookie inaccessible to JavaScript
    // secure: true, // Sends cookie only over HTTPS
  };

  return (
    res
      .status(200)
      .cookie("accessToken", accesToken, cookieOptions)
      // .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accesToken,
          },
          "User logged In Successfully"
        )
      )
  );
});

// logout user Api
const logOutUser = asyncHandler(async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    // secure:true
  };
  return (
    res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      // .clearCookie("refreshToken", cookieOptions)
      .json(new ApiResponse(200, {}, "user logged Out"))
  );
});

const getUserByID = asyncHandler(async (req, res) => {
  const { user_id } = req.body;

  const user = await User.findById(user_id);

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "user has been founded successfully"));
});

const getCurrentUsaer = asyncHandler(async (req, res) => {
  const userId = req?.user,
    userDeatils = await User.findById(userId);

  if (!userDeatils) {
    return res.status(404).json(new ApiError(404, "User not found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: userDeatils }, "User found successfully")
    );
});

const resetPasswordRequestEmail = asyncHandler(async (req, res) => {
  const email = req.body?.email;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Generate reset token and save user
  const resetToken = user.generateResetToken();
  await user.save();

  // Construct reset URL with token param
  const resetUrl = `http://localhost:3000/api/v1/users/forget-password/${resetToken}`;

  try {
    await sendMail(email, "Reset Password", resetUrl);

    return res.status(200).json({
      success: true,
      message: `Reset password email sent to ${email}`,
    });
  } catch (error) {
    console.error("Error sending reset password email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send reset password email",
      error: error.message,
    });
  }
});

const forgetPassword = asyncHandler(async (req, res) => {
  const { password, confirm } = req.body;
  const { token } = req.params;

  if (!password || !confirm) {
    throw new ApiError(400, "Password and confirm password are required");
  }

  if (password !== confirm) {
    throw new ApiError(400, "Passwords do not match");
  }

  // Find user by reset token and check expiry
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }, // token still valid?
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }

  // Update password and clear reset fields
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

export {
  registerUser,
  loginUser,
  logOutUser,
  getUserByID,
  getCurrentUsaer,
  resetPasswordRequestEmail,
  forgetPassword,
};
