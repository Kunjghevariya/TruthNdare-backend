import { getChallengeDeck } from './constants/challenges.js';
import { Room } from './model/room.model.js';
import { createIdleRound, ensureRoomState, getPublicRoomById, removePlayerFromRoom, trimRecentRounds } from './services/room.service.js';

let ioInstance;

const activeCountdowns = new Map();
const activeMembers = new Map();
const pendingDepartures = new Map();
const getRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

export const getIo = () => {
  if (!ioInstance) {
    throw new Error('Socket server has not been initialized yet.');
  }

  return ioInstance;
};

const clearRoomCountdown = (roomCode) => {
  const interval = activeCountdowns.get(roomCode);

  if (interval) {
    clearInterval(interval);
    activeCountdowns.delete(roomCode);
  }
};

const getMemberKey = (roomCode, playerName) => `${roomCode}:${playerName}`;

const cancelPendingDeparture = (roomCode, playerName) => {
  const key = getMemberKey(roomCode, playerName);
  const timeout = pendingDepartures.get(key);

  if (timeout) {
    clearTimeout(timeout);
    pendingDepartures.delete(key);
  }
};

const registerActiveMember = (roomCode, playerName, socketId) => {
  const key = getMemberKey(roomCode, playerName);
  const currentSockets = activeMembers.get(key) || new Set();
  currentSockets.add(socketId);
  activeMembers.set(key, currentSockets);
};

const unregisterActiveMember = (roomCode, playerName, socketId) => {
  const key = getMemberKey(roomCode, playerName);
  const currentSockets = activeMembers.get(key);

  if (!currentSockets) {
    return 0;
  }

  currentSockets.delete(socketId);

  if (!currentSockets.size) {
    activeMembers.delete(key);
    return 0;
  }

  activeMembers.set(key, currentSockets);
  return currentSockets.size;
};

export const initializeSocketServer = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomID, playerName }) => {
      if (!roomID || !playerName) {
        return;
      }

      socket.join(roomID);
      socket.data.roomID = roomID;
      socket.data.playerName = playerName || 'Anonymous';
      registerActiveMember(roomID, playerName, socket.id);
      cancelPendingDeparture(roomID, playerName);
    });

    socket.on('leaveRoom', ({ roomCode }) => {
      const activeRoomCode = roomCode || socket.data.roomID;
      const playerName = socket.data.playerName;

      if (!activeRoomCode || !playerName) {
        return;
      }

      unregisterActiveMember(activeRoomCode, playerName, socket.id);
      cancelPendingDeparture(activeRoomCode, playerName);
      socket.leave(activeRoomCode);
      socket.data.roomID = undefined;
    });

    socket.on('sendMessage', ({ roomID, playerName, text }) => {
      if (!roomID || !text?.trim()) {
        return;
      }

      io.to(roomID).emit('message', {
        roomID,
        playerName: playerName || socket.data.playerName || 'Anonymous',
        text: text.trim(),
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('start', async ({ roomCode }) => {
      if (!roomCode) {
        return;
      }

      const playerName = socket.data.playerName;
      const room = await ensureRoomState(await Room.findOne({ code: roomCode }));

      if (!room) {
        socket.emit('roomError', {
          roomCode,
          message: 'Room not found.',
        });
        return;
      }

      if (playerName !== room.leader) {
        socket.emit('roomError', {
          roomCode,
          message: 'Only the room leader can start the game.',
        });
        return;
      }

      if (room.players.length < 2) {
        socket.emit('roomError', {
          roomCode,
          message: 'At least two players are required before the game can start.',
        });
        return;
      }

      room.phase = 'playing';
      room.currentRound = createIdleRound();
      await room.save();

      const publicRoom = await getPublicRoomById(room._id);
      io.to(roomCode).emit('roomUpdated', publicRoom);
      io.to(roomCode).emit('start', {
        roomCode,
        leader: room.leader,
        players: room.players,
      });
    });

    socket.on('countdown', async ({ roomCode, seconds = 3 }) => {
      if (!roomCode) {
        return;
      }

      const playerName = socket.data.playerName;
      const room = await ensureRoomState(await Room.findOne({ code: roomCode }).select('players leader phase'));

      if (!room) {
        socket.emit('roomError', {
          roomCode,
          message: 'Room not found.',
        });
        return;
      }

      if (playerName !== room.leader) {
        socket.emit('roomError', {
          roomCode,
          message: 'Only the room leader can spin the wheel.',
        });
        return;
      }

      if (room.players.length < 2) {
        socket.emit('roomError', {
          roomCode,
          message: 'Need at least two players before spinning the wheel.',
        });
        return;
      }

      clearRoomCountdown(roomCode);

      let countdown = Number(seconds) || 3;
      room.currentRound = createIdleRound();
      await room.save();
      io.to(roomCode).emit('roomUpdated', await getPublicRoomById(room._id));
      io.to(roomCode).emit('countdown', { roomCode, seconds: countdown });

      const interval = setInterval(async () => {
        countdown -= 1;

        if (countdown > 0) {
          io.to(roomCode).emit('countdown', { roomCode, seconds: countdown });
          return;
        }

        clearRoomCountdown(roomCode);
        io.to(roomCode).emit('countdown', { roomCode, seconds: 0 });

        const room = await ensureRoomState(await Room.findOne({ code: roomCode }));
        const playerCount = room?.players?.length || 0;

        if (!playerCount) {
          return;
        }

        const selectedPlayerIndex = Math.floor(Math.random() * playerCount);
        const selectedPlayer = room.players[selectedPlayerIndex];

        room.currentRound = {
          status: 'selected',
          selectedPlayer,
          selectedPlayerIndex,
        };
        await room.save();

        io.to(roomCode).emit('rotateWheel', {
          roomCode,
          selectedPlayerIndex,
          selectedPlayer,
          playerCount,
        });
        io.to(roomCode).emit('roomUpdated', await getPublicRoomById(room._id));
      }, 1000);

      activeCountdowns.set(roomCode, interval);
    });

    socket.on('chooseTruthOrDare', async ({ roomCode, choice }) => {
      if (!roomCode || !choice) {
        return;
      }

      const normalizedChoice = choice === 'Dare' ? 'Dare' : 'Truth';
      const room = await ensureRoomState(await Room.findOne({ code: roomCode }));

      if (!room) {
        socket.emit('roomError', {
          roomCode,
          message: 'Room not found.',
        });
        return;
      }

      if (socket.data.playerName !== room.currentRound?.selectedPlayer) {
        socket.emit('roomError', {
          roomCode,
          message: 'Only the selected player can choose Truth or Dare.',
        });
        return;
      }

      if (room.currentRound?.status !== 'selected') {
        socket.emit('roomError', {
          roomCode,
          message: 'This round is not waiting for a Truth or Dare choice right now.',
        });
        return;
      }

      const challenge = getRandomItem(getChallengeDeck(normalizedChoice));
      room.currentRound = {
        ...room.currentRound,
        status: 'prompted',
        mode: normalizedChoice,
        prompt: challenge.prompt,
        tone: challenge.tone,
        intensity: challenge.intensity,
        durationLabel: challenge.durationLabel,
      };
      room.recentRounds = trimRecentRounds([
        ...(room.recentRounds || []),
        {
          playerName: room.currentRound.selectedPlayer,
          choice: normalizedChoice,
          prompt: challenge.prompt,
          tone: challenge.tone,
          intensity: challenge.intensity,
          durationLabel: challenge.durationLabel,
          createdAt: new Date(),
        },
      ]);
      await room.save();

      const publicRoom = await getPublicRoomById(room._id);
      io.to(roomCode).emit('challengeUpdated', {
        roomCode,
        selectedPlayer: room.currentRound.selectedPlayer,
        status: room.currentRound.status,
        choice: normalizedChoice,
        prompt: challenge.prompt,
        tone: challenge.tone,
        intensity: challenge.intensity,
        durationLabel: challenge.durationLabel,
      });
      io.to(roomCode).emit('roomUpdated', publicRoom);
    });

    socket.on('resetRound', async ({ roomCode }) => {
      if (!roomCode) {
        return;
      }

      const room = await ensureRoomState(await Room.findOne({ code: roomCode }));

      if (!room) {
        socket.emit('roomError', {
          roomCode,
          message: 'Room not found.',
        });
        return;
      }

      if (socket.data.playerName !== room.leader) {
        socket.emit('roomError', {
          roomCode,
          message: 'Only the room leader can reset the round.',
        });
        return;
      }

      room.currentRound = createIdleRound();
      await room.save();
      io.to(roomCode).emit('roomUpdated', await getPublicRoomById(room._id));
    });

    socket.on('disconnect', () => {
      const roomCode = socket.data.roomID;
      const playerName = socket.data.playerName;

      if (roomCode && playerName) {
        const remainingConnections = unregisterActiveMember(roomCode, playerName, socket.id);

        if (!remainingConnections) {
          const departureKey = getMemberKey(roomCode, playerName);
          const timeout = setTimeout(async () => {
            pendingDepartures.delete(departureKey);

            if (activeMembers.has(departureKey)) {
              return;
            }

            const result = await removePlayerFromRoom({
              roomCode,
              username: playerName,
            });

            if (!result.changed) {
              return;
            }

            if (result.deleted) {
              clearRoomCountdown(roomCode);
              io.to(roomCode).emit('roomClosed', {
                roomCode,
                reason: 'The room was closed because everyone left.',
              });
              return;
            }

            io.to(roomCode).emit('playerLeft', {
              roomCode,
              playerName,
              leader: result.room.leader,
              leaderChanged: result.leaderChanged,
              players: result.room.players,
              reason: 'disconnect',
            });
            io.to(roomCode).emit('roomUpdated', result.room);
          }, 3500);

          pendingDepartures.set(departureKey, timeout);
        }
      }

      if (roomCode && activeCountdowns.has(roomCode) && !io.sockets.adapter.rooms.get(roomCode)?.size) {
        clearRoomCountdown(roomCode);
      }
    });
  });

  io.engine.on('connection_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return io;
};
