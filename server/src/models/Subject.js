import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: 'indigo',
    },
  },
  {
    timestamps: true,
  }
);

subjectSchema.index({ displayOrder: 1, name: 1 });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
