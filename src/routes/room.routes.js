import { Router } from "express";
import { createRoom, joinRoom, leaveRoom, showRoom } from "../controller/room.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";


const roomRouter = Router()
roomRouter.route("/create").post(verifyJWT,createRoom)
roomRouter.route("/join").post(verifyJWT,joinRoom)
roomRouter.route("/leave").post(verifyJWT,leaveRoom)
roomRouter.route("/showroom").get(verifyJWT,showRoom)

export default roomRouter
