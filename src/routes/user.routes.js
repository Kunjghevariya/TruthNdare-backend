import { Router } from "express";
import { login, registerUser,guestId } from "../controller/user.controller.js";

const userRouter = Router()
userRouter.route("/register").post(registerUser)
userRouter.route("/login").post(login)
userRouter.route("/guest").post(guestId)





export default userRouter