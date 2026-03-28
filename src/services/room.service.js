import { Room } from '../model/room.model.js';

export const createIdleRound = () => ({
  status: 'idle',
  selectedPlayer: undefined,
  selectedPlayerIndex: undefined,
  mode: undefined,
  prompt: undefined,
  tone: undefined,
  intensity: undefined,
  durationLabel: undefined,
});

const MAX_RECENT_ROUNDS = 6;

export const trimRecentRounds = (recentRounds = []) => recentRounds.slice(-MAX_RECENT_ROUNDS);

export const getPublicRoomById = async (roomId) => {
  const room = await Room.findById(roomId).select('-password');
  return ensureRoomState(room);
};

export const getPublicRoomByCode = async (roomCode) => {
  const room = await Room.findOne({ code: roomCode }).select('-password');
  return ensureRoomState(room);
};

export const getNextLeader = (players, previousLeader) => {
  if (!players?.length) {
    return null;
  }

  if (previousLeader && players.includes(previousLeader)) {
    return previousLeader;
  }

  return players[0];
};

export const ensureRoomState = async (room) => {
  if (!room) {
    return null;
  }

  let changed = false;

  if (!room.leader) {
    room.leader = getNextLeader(room.players, null);
    changed = true;
  }

  if (!room.phase) {
    room.phase = 'lobby';
    changed = true;
  }

  if (!room.currentRound?.status) {
    room.currentRound = createIdleRound();
    changed = true;
  }

  if (!Array.isArray(room.recentRounds)) {
    room.recentRounds = [];
    changed = true;
  } else if (room.recentRounds.length > MAX_RECENT_ROUNDS) {
    room.recentRounds = trimRecentRounds(room.recentRounds);
    changed = true;
  }

  if (changed) {
    await room.save();
  }

  return room;
};

export const removePlayerFromRoom = async ({ roomCode, username, retryCount = 0 }) => {
  const room = await ensureRoomState(await Room.findOne({ code: roomCode }));

  if (!room) {
    return {
      changed: false,
      deleted: false,
      room: null,
      leaderChanged: false,
    };
  }

  if (!room.players.includes(username)) {
    return {
      changed: false,
      deleted: false,
      room: await getPublicRoomById(room._id),
      leaderChanged: false,
    };
  }

  const remainingPlayers = room.players.filter((player) => player !== username);
  const nextLeader = getNextLeader(remainingPlayers, room.leader);
  const leaderChanged = room.leader !== nextLeader;

  if (!remainingPlayers.length) {
    await Room.deleteOne({ _id: room._id });
    return {
      changed: true,
      deleted: true,
      room: null,
      leaderChanged: true,
      previousRoom: {
        code: room.code,
        name: room.name,
      },
    };
  }

  room.players = remainingPlayers;
  room.leader = nextLeader;
  room.phase = remainingPlayers.length >= 2 ? room.phase : 'lobby';

  if (room.currentRound?.selectedPlayer === username || remainingPlayers.length < 2) {
    room.currentRound = createIdleRound();
  }

  try {
    await room.save();
  } catch (error) {
    if (error?.name === 'VersionError' && retryCount < 2) {
      return removePlayerFromRoom({
        roomCode,
        username,
        retryCount: retryCount + 1,
      });
    }

    throw error;
  }

  return {
    changed: true,
    deleted: false,
    room: await getPublicRoomById(room._id),
    leaderChanged,
  };
};
