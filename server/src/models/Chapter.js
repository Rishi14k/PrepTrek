import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Chapter name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
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
  },
  {
    timestamps: true,
  }
);

chapterSchema.index({ subjectId: 1, slug: 1 }, { unique: true });
chapterSchema.index({ subjectId: 1, displayOrder: 1, name: 1 });

const Chapter = mongoose.model('Chapter', chapterSchema);
export default Chapter;
