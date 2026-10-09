import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    username: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    targetExam: {
      type: String,
      default: 'General Entrance Exam',
      trim: true,
    },
    targetExamDate: {
      type: Date,
    },
    dailyStudyGoalSeconds: {
      type: Number,
      default: 7200, // 2 hours in seconds
      min: 0,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    leaderboardOptIn: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1 });
userSchema.index({ leaderboardOptIn: 1 });

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
