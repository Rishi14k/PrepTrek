import StudySession from '../models/StudySession.js';

export const getActiveSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const session = await StudySession.findOne({
      userId,
      status: { $in: ['running', 'paused'] },
    })
      .populate('subjectId', 'name color')
      .populate('chapterId', 'name');

    if (!session) {
      return res.status(200).json({ success: true, activeSession: null });
    }

    // Calculate real-time duration based on authoritative server clock
    let currentElapsed = session.durationSeconds || 0;
    if (session.status === 'running') {
      const now = new Date();
      // Started or last resumed time
      const referenceTime = session.lastPausedAt ? session.lastPausedAt : session.startedAt;
      const runningDelta = Math.floor((now.getTime() - new Date(referenceTime).getTime()) / 1000);
      currentElapsed += Math.max(0, runningDelta);
    }

    const sessionObj = session.toObject();
    sessionObj.currentCalculatedDuration = currentElapsed;

    return res.status(200).json({
      success: true,
      activeSession: sessionObj,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve active study session.',
    });
  }
};

export const startSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subjectId, chapterId, sessionType = 'standard', pomodoroPhase = 'focus', notes = '' } = req.body;

    // Check if an active session already exists
    const existing = await StudySession.findOne({
      userId,
      status: { $in: ['running', 'paused'] },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An active study session is already running. Please complete or stop it before starting another.',
        existingSessionId: existing._id,
      });
    }

    const session = await StudySession.create({
      userId,
      subjectId: subjectId || null,
      chapterId: chapterId || null,
      startedAt: new Date(),
      status: 'running',
      sessionType,
      pomodoroPhase,
      notes,
      durationSeconds: 0,
      pausedDurationSeconds: 0,
    });

    const populated = await StudySession.findById(session._id)
      .populate('subjectId', 'name color')
      .populate('chapterId', 'name');

    return res.status(201).json({
      success: true,
      message: 'Study session started.',
      session: populated,
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start study session.',
    });
  }
};

export const pauseSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    const session = await StudySession.findOne({ _id: sessionId, userId });
    if (!session || session.status !== 'running') {
      return res.status(400).json({
        success: false,
        message: 'No active running session found to pause.',
      });
    }

    const now = new Date();
    // Compute elapsed duration up to pause
    const referenceTime = session.lastPausedAt ? session.lastPausedAt : session.startedAt;
    const runningDelta = Math.floor((now.getTime() - new Date(referenceTime).getTime()) / 1000);
    session.durationSeconds = (session.durationSeconds || 0) + Math.max(0, runningDelta);

    session.status = 'paused';
    session.lastPausedAt = now;
    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Study session paused.',
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to pause session.',
    });
  }
};

export const resumeSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    const session = await StudySession.findOne({ _id: sessionId, userId });
    if (!session || session.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'No paused session found to resume.',
      });
    }

    const now = new Date();
    if (session.lastPausedAt) {
      const pauseDuration = Math.floor((now.getTime() - new Date(session.lastPausedAt).getTime()) / 1000);
      session.pausedDurationSeconds = (session.pausedDurationSeconds || 0) + Math.max(0, pauseDuration);
    }

    session.status = 'running';
    session.lastPausedAt = now; // Mark resumption time
    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Study session resumed.',
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to resume session.',
    });
  }
};

export const stopSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;
    const { notes, subjectId, chapterId } = req.body;

    const session = await StudySession.findOne({ _id: sessionId, userId });
    if (!session || !['running', 'paused'].includes(session.status)) {
      return res.status(400).json({
        success: false,
        message: 'No active session found to complete.',
      });
    }

    const now = new Date();
    if (session.status === 'running') {
      const referenceTime = session.lastPausedAt ? session.lastPausedAt : session.startedAt;
      const runningDelta = Math.floor((now.getTime() - new Date(referenceTime).getTime()) / 1000);
      session.durationSeconds = (session.durationSeconds || 0) + Math.max(0, runningDelta);
    }

    session.status = 'completed';
    session.endedAt = now;
    if (notes !== undefined) session.notes = notes;
    if (subjectId !== undefined) session.subjectId = subjectId || null;
    if (chapterId !== undefined) session.chapterId = chapterId || null;

    await session.save();

    const populated = await StudySession.findById(session._id)
      .populate('subjectId', 'name color')
      .populate('chapterId', 'name');

    return res.status(200).json({
      success: true,
      message: 'Study session saved successfully!',
      session: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to stop session.',
    });
  }
};

export const discardSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    const session = await StudySession.findOneAndDelete({
      _id: sessionId,
      userId,
      status: { $in: ['running', 'paused'] },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found to discard.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Active study session discarded.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to discard session.',
    });
  }
};

export const getSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, subjectId, limit = 50 } = req.query;

    const query = { userId, status: 'completed' };
    if (subjectId) query.subjectId = subjectId;
    if (startDate || endDate) {
      query.startedAt = {};
      if (startDate) query.startedAt.$gte = new Date(startDate);
      if (endDate) query.startedAt.$lte = new Date(endDate);
    }

    const sessions = await StudySession.find(query)
      .populate('subjectId', 'name color')
      .populate('chapterId', 'name')
      .sort({ startedAt: -1 })
      .limit(parseInt(limit, 10));

    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch sessions.' });
  }
};

export const updateSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { durationSeconds, notes, subjectId, chapterId } = req.body;

    const session = await StudySession.findOne({ _id: req.params.sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (durationSeconds !== undefined) session.durationSeconds = durationSeconds;
    if (notes !== undefined) session.notes = notes;
    if (subjectId !== undefined) session.subjectId = subjectId || null;
    if (chapterId !== undefined) session.chapterId = chapterId || null;

    await session.save();

    const populated = await StudySession.findById(session._id)
      .populate('subjectId', 'name color')
      .populate('chapterId', 'name');

    return res.status(200).json({ success: true, session: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update session.' });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const session = await StudySession.findOneAndDelete({ _id: req.params.sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }
    return res.status(200).json({ success: true, message: 'Study session deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete session.' });
  }
};
