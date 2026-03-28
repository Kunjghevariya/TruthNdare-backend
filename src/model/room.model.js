import mongoose, { Schema } from "mongoose";

const recentRoundSchema = new Schema(
    {
        playerName: {
          type: String,
          trim: true,
        },
        choice: {
          type: String,
          enum: ['Truth', 'Dare'],
        },
        prompt: {
          type: String,
          trim: true,
        },
        tone: {
          type: String,
          trim: true,
        },
        intensity: {
          type: String,
          trim: true,
        },
        durationLabel: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
    },
    {
        _id: false,
    }
);

const roomSchema = new Schema(
    {
        name: {
          type: String,
          required: true,
          unique: true,
        },
        isPrivate: {
          type: Boolean,
          default: false,
        },
        password: {
          type: String,
          required: function() {
            return this.isPrivate;
          },
        },
        code: { 
          type: String, 
          unique: true, 
          required: true 
        },
        leader: {
          type: String,
          required: true,
          trim: true,
        },
        phase: {
          type: String,
          enum: ['lobby', 'playing'],
          default: 'lobby',
        },
        currentRound: {
          status: {
            type: String,
            enum: ['idle', 'selected', 'prompted'],
            default: 'idle',
          },
          selectedPlayer: {
            type: String,
          },
          selectedPlayerIndex: {
            type: Number,
          },
          mode: {
            type: String,
            enum: ['Truth', 'Dare'],
          },
          prompt: {
            type: String,
          },
          tone: {
            type: String,
          },
          intensity: {
            type: String,
          },
          durationLabel: {
            type: String,
          },
        },
        recentRounds: [recentRoundSchema],

        players: [
          { type: String }
        ],
      },
      {
        timestamps: true,
      }
);

export const Room = mongoose.model('Room',roomSchema);
