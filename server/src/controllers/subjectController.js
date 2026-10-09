import Subject from '../models/Subject.js';
import Chapter from '../models/Chapter.js';

export const getSubjects = async (req, res) => {
  try {
    const filter = req.user?.role === 'admin' && req.query.all === 'true' ? {} : { isActive: true };
    const subjects = await Subject.find(filter).sort({ displayOrder: 1, name: 1 });
    return res.status(200).json({ success: true, subjects });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subjects.' });
  }
};

export const getChaptersBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const filter = { subjectId };
    if (!(req.user?.role === 'admin' && req.query.all === 'true')) {
      filter.isActive = true;
    }

    const chapters = await Chapter.find(filter).sort({ displayOrder: 1, name: 1 });
    return res.status(200).json({ success: true, chapters });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch chapters.' });
  }
};

export const getChapterById = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.chapterId).populate('subjectId');
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found.' });
    }
    return res.status(200).json({ success: true, chapter });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch chapter.' });
  }
};

// Admin Controller Operations
export const createSubject = async (req, res) => {
  try {
    const { name, description, color, displayOrder } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await Subject.findOne({ slug });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Subject with this name already exists.' });
    }

    const subject = await Subject.create({
      name,
      slug,
      description,
      color: color || 'indigo',
      displayOrder: displayOrder || 0,
      isActive: true,
    });

    return res.status(201).json({ success: true, subject });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create subject.' });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.subjectId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }
    return res.status(200).json({ success: true, subject });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update subject.' });
  }
};

export const createChapter = async (req, res) => {
  try {
    const { subjectId, name, description, displayOrder } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await Chapter.findOne({ subjectId, slug });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Chapter with this name already exists in this subject.',
      });
    }

    const chapter = await Chapter.create({
      subjectId,
      name,
      slug,
      description,
      displayOrder: displayOrder || 0,
      isActive: true,
    });

    return res.status(201).json({ success: true, chapter });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create chapter.' });
  }
};

export const updateChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.chapterId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found.' });
    }
    return res.status(200).json({ success: true, chapter });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update chapter.' });
  }
};
