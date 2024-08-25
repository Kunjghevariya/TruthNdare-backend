import { Game } from '../model/game.model.js';
import { Room } from '../model/room.model.js';
import { io } from '../index.js';
import { ApiError } from '../utills/ApiError.js';
import { asyncHandler } from '../utills/asyncHandler.js';

const startGame = asyncHandler(async (req, res) => {
  const { roomId } = req.body;

  const room = await Room.findById(roomId).populate('players');
  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  const game = await Game.create({
    roomId,
    players: room.players.map(player => player._id),
    currentTurn: room.players[0]._id, // Set initial turn to the first player
    truthOrDare: null,
    challenges: [],
    isCompleted: false
  });

  io.to(roomId).emit('gameStarted', game);

  return res.status(201).json({
    status: 201,
    data: game,
    message: 'Game created successfully'
  });
});

const chooseRandomPlayer = asyncHandler(async (req, res) => {
  const { gameId } = req.body;
  const game = await Game.findById(gameId).populate({
    path: 'roomId',
    populate: {
      path: 'players',
      model: 'User'
    }
  });

  if (!game) {
    throw new ApiError(404, 'Game not found');
  }

  const players = game.roomId.players;
  const randomPlayerIndex = Math.floor(Math.random() * players.length);
  const selectedPlayer = players[randomPlayerIndex]._id;

  game.currentTurn = selectedPlayer;
  game.truthOrDare = null;

  await game.save();

  io.to(game.roomId._id).emit('playerSelected', { playerId: selectedPlayer });

  return res.status(200).json({
    status: 200,
    data: game,
    message: 'Random player selected successfully'
  });
});

const chooseTruthOrDare = asyncHandler(async (req, res) => {
  const { gameId, choice } = req.body;

  const game = await Game.findById(gameId);
  if (!game) {
    throw new ApiError(404, 'Game not found');
  }

  if (!["Truth", "Dare"].includes(choice)) {
    throw new ApiError(400, 'Invalid choice');
  }

  game.truthOrDare = choice;
  await game.save();

  io.to(game.roomId).emit('truthOrDareChosen', { choice });

  return res.status(200).json({
    status: 200,
    data: game,
    message: 'Truth or Dare choice recorded successfully'
  });
});

const completeChallenge = asyncHandler(async (req, res) => {
  const { gameId, playerId, challengeCompleted } = req.body;

  const game = await Game.findById(gameId);
  if (!game) {
    throw new ApiError(404, 'Game not found');
  }

  game.challenges.push({
    userId: playerId,
    challenge: challengeCompleted
  });

  if (game.challenges.length === game.players.length) {
    game.isCompleted = true;
    io.to(game.roomId).emit('gameFinished', game);
  }

  await game.save();

  return res.status(200).json({
    status: 200,
    data: game,
    message: 'Challenge status updated successfully'
  });
});

const nextTurn = asyncHandler(async (req, res) => {
  const { gameId } = req.body;

  const game = await Game.findById(gameId).populate('players');
  if (!game) {
    throw new ApiError(404, 'Game not found');
  }

  const currentPlayerIndex = game.players.findIndex(player => player._id.equals(game.currentTurn));
  const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
  game.currentTurn = game.players[nextPlayerIndex]._id;

  await game.save();

  io.to(game.roomId).emit('nextTurn', game.currentTurn);

  return res.status(200).json({
    status: 200,
    data: game,
    message: 'Turn updated successfully'
  });
});

export { chooseRandomPlayer, chooseTruthOrDare, completeChallenge, nextTurn, startGame };

