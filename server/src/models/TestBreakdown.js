import mongoose from 'mongoose';

const testBreakdownSchema = new mongoose.Schema(
  {
    parentTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
      index: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    attemptedQuestions: {
      type: Number,
      required: true,
      min: 0,
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },
    incorrectAnswers: {
      type: Number,
      required: true,
      min: 0,
    },
    unattemptedQuestions: {
      type: Number,
      required: true,
      min: 0,
    },
    marksObtained: {
      type: Number,
      required: true,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

testBreakdownSchema.index({ parentTestId: 1, subjectId: 1, chapterId: 1 });
testBreakdownSchema.index({ userId: 1, subjectId: 1, chapterId: 1 });

const TestBreakdown = mongoose.model('TestBreakdown', testBreakdownSchema);
export default TestBreakdown;
