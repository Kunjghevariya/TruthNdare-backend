import { Router } from "express";
import { chooseRandomPlayer, chooseTruthOrDare, completeChallenge, nextTurn, startGame } from "../controller/game.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const gameRouter = Router();

gameRouter.route("/start").post(verifyJWT,startGame)
gameRouter.route("/chooserandom").post(verifyJWT,chooseRandomPlayer)
gameRouter.route("/choose").post(verifyJWT,chooseTruthOrDare)
gameRouter.route("/nextturn").post(verifyJWT,nextTurn)
gameRouter.route("/complete-challenge").post(verifyJWT,completeChallenge)


export default gameRouter