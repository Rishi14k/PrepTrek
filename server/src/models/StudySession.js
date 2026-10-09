import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
      index: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    pausedDurationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPausedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['running', 'paused', 'completed', 'discarded'],
      default: 'running',
      index: true,
    },
    sessionType: {
      type: String,
      enum: ['standard', 'pomodoro'],
      default: 'standard',
    },
    pomodoroPhase: {
      type: String,
      enum: ['focus', 'short_break', 'long_break'],
      default: 'focus',
    },
    notes: {
      type: String,
      default: '',
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

studySessionSchema.index({ userId: 1, startedAt: -1 });
studySessionSchema.index({ userId: 1, status: 1 });
studySessionSchema.index({ userId: 1, subjectId: 1 });

const StudySession = mongoose.model('StudySession', studySessionSchema);
export default StudySession;
