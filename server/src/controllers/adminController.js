import User from '../models/User.js';
import Test from '../models/Test.js';
import StudySession from '../models/StudySession.js';
import Subject from '../models/Subject.js';
import Chapter from '../models/Chapter.js';
import SystemSetting from '../models/SystemSetting.js';

export const getAdminDashboard = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalStudents,
      activeStudents,
      totalTests,
      totalSubjects,
      totalChapters,
      completedSessions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', updatedAt: { $gte: thirtyDaysAgo } }),
      Test.countDocuments(),
      Subject.countDocuments(),
      Chapter.countDocuments(),
      StudySession.find({ status: 'completed' }).select('durationSeconds'),
    ]);

    const totalStudySeconds = completedSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

    const systemConfig =
      (await SystemSetting.findOne({ key: 'global_config' })) ||
      (await SystemSetting.create({ key: 'global_config' }));

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        activeStudents,
        totalTests,
        totalSubjects,
        totalChapters,
        totalStudyHours: Number((totalStudySeconds / 3600).toFixed(1)),
      },
      systemConfig,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
};

export const getStudents = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch students.' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, role, displayName } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role !== undefined) user.role = role;
    if (displayName !== undefined) user.displayName = displayName;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Student updated successfully.',
      user: user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update student.' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const {
      strongThreshold,
      developingThreshold,
      minEvidenceTests,
      minEvidenceQuestions,
      neglectedDaysThreshold,
      leaderboardMinEvidenceTests,
    } = req.body;

    const config = await SystemSetting.findOneAndUpdate(
      { key: 'global_config' },
      {
        ...(strongThreshold !== undefined && { strongThreshold }),
        ...(developingThreshold !== undefined && { developingThreshold }),
        ...(minEvidenceTests !== undefined && { minEvidenceTests }),
        ...(minEvidenceQuestions !== undefined && { minEvidenceQuestions }),
        ...(neglectedDaysThreshold !== undefined && { neglectedDaysThreshold }),
        ...(leaderboardMinEvidenceTests !== undefined && { leaderboardMinEvidenceTests }),
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'System classification thresholds and settings updated.',
      config,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
};
