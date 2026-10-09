import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global_config',
    },
    strongThreshold: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    developingThreshold: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
    minEvidenceTests: {
      type: Number,
      default: 2,
      min: 1,
    },
    minEvidenceQuestions: {
      type: Number,
      default: 20,
      min: 1,
    },
    neglectedDaysThreshold: {
      type: Number,
      default: 14,
      min: 1,
    },
    leaderboardMinEvidenceTests: {
      type: Number,
      default: 2,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);
export default SystemSetting;
