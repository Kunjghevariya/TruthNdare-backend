import mongoose, { Schema } from "mongoose";

const gameSchema = new Schema(
    {
        roomId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Room',
          required: true,
        },
        currentTurn: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        truthOrDare: {
          type: String,
          enum: ['Truth', 'Dare'],
        },
        challenges: [
          {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            challenge: { type: String },
          },
        ],
        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    {
        timestamps : true
    }
);


export const Game = mongoose.model('Game', gameSchema);

