import User from '../models/User.js';
import Test from '../models/Test.js';
import StudySession from '../models/StudySession.js';
import StudyTask from '../models/StudyTask.js';
import { clearAuthCookies } from '../utils/token.js';

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user.toJSON(),
  });
};

export const updateMe = async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'username',
      'displayName',
      'targetExam',
      'targetExamDate',
      'dailyStudyGoalSeconds',
      'timezone',
      'themePreference',
      'leaderboardOptIn',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        req.user[field] = req.body[field];
      }
    });

    await req.user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: req.user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
    });
  }
};

export const getPreferences = async (req, res) => {
  const {
    dailyStudyGoalSeconds,
    timezone,
    themePreference,
    leaderboardOptIn,
    displayName,
  } = req.user;

  return res.status(200).json({
    success: true,
    preferences: {
      dailyStudyGoalSeconds,
      timezone,
      themePreference,
      leaderboardOptIn,
      displayName,
    },
  });
};

export const updatePreferences = async (req, res) => {
  try {
    const { dailyStudyGoalSeconds, timezone, themePreference, leaderboardOptIn, displayName } =
      req.body;

    if (dailyStudyGoalSeconds !== undefined) req.user.dailyStudyGoalSeconds = dailyStudyGoalSeconds;
    if (timezone !== undefined) req.user.timezone = timezone;
    if (themePreference !== undefined) req.user.themePreference = themePreference;
    if (leaderboardOptIn !== undefined) req.user.leaderboardOptIn = leaderboardOptIn;
    if (displayName !== undefined) req.user.displayName = displayName;

    await req.user.save();

    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully.',
      preferences: {
        dailyStudyGoalSeconds: req.user.dailyStudyGoalSeconds,
        timezone: req.user.timezone,
        themePreference: req.user.themePreference,
        leaderboardOptIn: req.user.leaderboardOptIn,
        displayName: req.user.displayName,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update preferences.',
    });
  }
};

export const exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;

    const tests = await Test.find({ userId }).populate('subjectId chapterId');
    const sessions = await StudySession.find({ userId }).populate('subjectId chapterId');
    const tasks = await StudyTask.find({ userId }).populate('subjectId chapterId');

    const exportPayload = {
      user: req.user.toJSON(),
      exportDate: new Date().toISOString(),
      tests,
      studySessions: sessions,
      tasks,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="preptrack-export-${req.user._id}.json"`);
    return res.status(200).json(exportPayload);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to export user data.',
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Remove user records
    await Promise.all([
      Test.deleteMany({ userId }),
      StudySession.deleteMany({ userId }),
      StudyTask.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Your account and all associated test data have been permanently deleted.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account.',
    });
  }
};
