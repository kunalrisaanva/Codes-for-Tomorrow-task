import express from 'express';
import { registerUser, loginUser ,refreshToken} from '../controllers/user.controller.js';


const router = express.Router();


// unprotected routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshToken);


// protected routes

export { router as userRoutes };


