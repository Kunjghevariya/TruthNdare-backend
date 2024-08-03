import mongoose, { Schema } from "mongoose";


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

        players: [
          { type: String }
        ],
      },
      {
        timestamps: true,
      }
);

export const Room = mongoose.model('Room',roomSchema);

