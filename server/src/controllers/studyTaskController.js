import StudyTask from '../models/StudyTask.js';

export const getTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, priority } = req.query;

    const query = { userId };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await StudyTask.find(query)
      .populate('subjectId', 'name color')
      .populate('chapterId', 'name')
      .sort({ dueDate: 1, priority: -1, createdAt: -1 });

    return res.status(200).json({ success: true, tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
  }
};

export const createTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      description,
      subjectId,
      chapterId,
      priority = 'medium',
      dueDate,
      estimatedDurationSeconds = 3600,
      linkedRecommendationType,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const task = await StudyTask.create({
      userId,
      title,
      description: description || '',
      subjectId: subjectId || null,
      chapterId: chapterId || null,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedDurationSeconds,
      linkedRecommendationType: linkedRecommendationType || '',
      status: 'pending',
    });

    const populated = await StudyTask.findById(task._id)
      .populate('subjectId', 'name color')
      .populate('chapterId', 'name');

    return res.status(201).json({
      success: true,
      message: 'Study task scheduled successfully!',
      task: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create task.' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;

    const task = await StudyTask.findOne({ _id: taskId, userId });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const fields = [
      'title',
      'description',
      'subjectId',
      'chapterId',
      'priority',
      'dueDate',
      'estimatedDurationSeconds',
      'status',
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        task[f] = req.body[f];
      }
    });

    if (req.body.status === 'completed' && !task.completedAt) {
      task.completedAt = new Date();
    } else if (req.body.status && req.body.status !== 'completed') {
      task.completedAt = null;
    }

    await task.save();

    const populated = await StudyTask.findById(task._id)
      .populate('subjectId', 'name color')
      .populate('chapterId', 'name');

    return res.status(200).json({ success: true, task: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update task.' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const task = await StudyTask.findOneAndDelete({ _id: req.params.taskId, userId });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    return res.status(200).json({ success: true, message: 'Task removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete task.' });
  }
};
