import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from 'crypto';

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is Required"],
      trim: true,
      index: true,
      unique: [true, "Given Email Should be Unique"],
    },

    firstName: {
      type: String,
      required: [true, "First Name is Required"],
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, "Last Name is Required"],
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is Required"],
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  // console.log("Password before hashing: ", this.password);
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (passwword) {
  return await bcrypt.compare(passwword, this.password);
};

userSchema.methods.genrateAccessToken = async function () {
  return await jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCRESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCRESS_TOKEN_EXPIRY,
    }
  );

  
};

// Generate Reset Password Token and Expiry (valid 5 minutes)
userSchema.methods.generateResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = resetToken;
  this.resetPasswordExpires = Date.now() + 5 * 60 * 1000; // 5 minutes from now

  return resetToken;
};

export const User = model("User", userSchema);
