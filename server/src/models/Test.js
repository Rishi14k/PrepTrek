import mongoose from 'mongoose';

const testSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    testName: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
      maxlength: 120,
    },
    testDate: {
      type: Date,
      required: [true, 'Test date is required'],
      default: Date.now,
    },
    testType: {
      type: String,
      enum: ['chapter', 'sectional', 'full_mock', 'previous_year'],
      default: 'chapter',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
    },
    totalQuestions: {
      type: Number,
      required: [true, 'Total questions is required'],
      min: [1, 'Total questions must be at least 1'],
    },
    attemptedQuestions: {
      type: Number,
      required: [true, 'Attempted questions is required'],
      min: 0,
    },
    correctAnswers: {
      type: Number,
      required: [true, 'Correct answers is required'],
      min: 0,
    },
    incorrectAnswers: {
      type: Number,
      required: [true, 'Incorrect answers is required'],
      min: 0,
    },
    unattemptedQuestions: {
      type: Number,
      required: [true, 'Unattempted questions is required'],
      min: 0,
    },
    marksObtained: {
      type: Number,
      required: [true, 'Marks obtained is required'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks is required'],
      min: [1, 'Maximum marks must be greater than 0'],
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    isParent: {
      type: Boolean,
      default: false,
    },
    parentTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

testSchema.index({ userId: 1, testDate: -1 });
testSchema.index({ userId: 1, subjectId: 1, testDate: -1 });
testSchema.index({ userId: 1, chapterId: 1, testDate: -1 });
testSchema.index({ userId: 1, testType: 1 });
testSchema.index({ parentTestId: 1 });

const Test = mongoose.model('Test', testSchema);
export default Test;
