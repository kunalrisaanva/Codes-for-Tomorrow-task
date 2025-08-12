import express from 'express';
import { registerUser, loginUser,logOutUser , getUserByID , getCurrentUsaer , resetPasswordRequestEmail, forgetPassword } from '../controllers/user.controller.js';
import { verifyJwt as verifyRoute } from "../middleware/auth.middleware.js"; // use this to protect routes

const router = express.Router();


// unprotected routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);


// protected routes

router.route("/logout").post(verifyRoute, logOutUser);
router.route("/current-user").get(verifyRoute, getCurrentUsaer);

router.route("/reset-password").post(verifyRoute,resetPasswordRequestEmail);
router.route("/forget-password/:token").post(verifyRoute,forgetPassword)
router.route("/user").get(verifyRoute,getUserByID)

export { router as userRoutes };


