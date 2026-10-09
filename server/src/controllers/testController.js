import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import Test from '../models/Test.js';
import TestBreakdown from '../models/TestBreakdown.js';
import Subject from '../models/Subject.js';
import Chapter from '../models/Chapter.js';
import { calculateScorePercentage, calculateAccuracy } from '../services/analyticsService.js';

export const createTest = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      testName,
      testDate,
      testType,
      subjectId,
      chapterId,
      totalQuestions,
      attemptedQuestions,
      correctAnswers,
      incorrectAnswers,
      unattemptedQuestions,
      marksObtained,
      maxMarks,
      durationSeconds,
      notes,
      breakdowns = [],
    } = req.body;

    const isParent = breakdowns && breakdowns.length > 0;

    const test = await Test.create({
      userId,
      testName,
      testDate: testDate ? new Date(testDate) : new Date(),
      testType: testType || 'chapter',
      subjectId: subjectId || null,
      chapterId: chapterId || null,
      totalQuestions,
      attemptedQuestions,
      correctAnswers,
      incorrectAnswers,
      unattemptedQuestions,
      marksObtained,
      maxMarks,
      durationSeconds: durationSeconds || 0,
      notes: notes || '',
      isParent,
    });

    if (isParent) {
      const breakdownDocs = breakdowns.map((b) => ({
        parentTestId: test._id,
        userId,
        subjectId: b.subjectId,
        chapterId: b.chapterId || null,
        totalQuestions: b.totalQuestions,
        attemptedQuestions: b.attemptedQuestions,
        correctAnswers: b.correctAnswers,
        incorrectAnswers: b.incorrectAnswers,
        unattemptedQuestions: b.unattemptedQuestions,
        marksObtained: b.marksObtained,
        maxMarks: b.maxMarks,
        durationSeconds: b.durationSeconds || 0,
      }));
      await TestBreakdown.insertMany(breakdownDocs);
    }

    const populated = await Test.findById(test._id)
      .populate('subjectId', 'name slug color')
      .populate('chapterId', 'name slug');

    return res.status(201).json({
      success: true,
      message: 'Test result recorded successfully!',
      test: populated,
    });
  } catch (error) {
    console.error('Error creating test:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record test result.',
    });
  }
};

export const getTests = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      subjectId,
      chapterId,
      testType,
      startDate,
      endDate,
      sortBy = 'testDate',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { userId };

    if (subjectId) query.subjectId = subjectId;
    if (chapterId) query.chapterId = chapterId;
    if (testType) query.testType = testType;

    if (startDate || endDate) {
      query.testDate = {};
      if (startDate) query.testDate.$gte = new Date(startDate);
      if (endDate) query.testDate.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [tests, total] = await Promise.all([
      Test.find(query)
        .populate('subjectId', 'name slug color')
        .populate('chapterId', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Test.countDocuments(query),
    ]);

    // Attach calculated metrics for clean client consumption
    const formattedTests = tests.map((t) => {
      const obj = t.toObject();
      obj.scorePercentage = calculateScorePercentage(t.marksObtained, t.maxMarks);
      obj.accuracy = calculateAccuracy(t.correctAnswers, t.attemptedQuestions);
      return obj;
    });

    return res.status(200).json({
      success: true,
      tests: formattedTests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch test records.',
    });
  }
};

export const getTestById = async (req, res) => {
  try {
    const userId = req.user._id;
    const test = await Test.findOne({ _id: req.params.testId, userId })
      .populate('subjectId', 'name slug color')
      .populate('chapterId', 'name slug');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test record not found or access denied.',
      });
    }

    let breakdowns = [];
    if (test.isParent) {
      breakdowns = await TestBreakdown.find({ parentTestId: test._id })
        .populate('subjectId', 'name slug color')
        .populate('chapterId', 'name slug');
    }

    const formattedTest = test.toObject();
    formattedTest.scorePercentage = calculateScorePercentage(test.marksObtained, test.maxMarks);
    formattedTest.accuracy = calculateAccuracy(test.correctAnswers, test.attemptedQuestions);
    formattedTest.breakdowns = breakdowns;

    return res.status(200).json({
      success: true,
      test: formattedTest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch test details.',
    });
  }
};

export const updateTest = async (req, res) => {
  try {
    const userId = req.user._id;
    const test = await Test.findOne({ _id: req.params.testId, userId });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test record not found or access denied.',
      });
    }

    const updatable = [
      'testName',
      'testDate',
      'testType',
      'subjectId',
      'chapterId',
      'totalQuestions',
      'attemptedQuestions',
      'correctAnswers',
      'incorrectAnswers',
      'unattemptedQuestions',
      'marksObtained',
      'maxMarks',
      'durationSeconds',
      'notes',
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        test[field] = req.body[field];
      }
    });

    await test.save();

    const populated = await Test.findById(test._id)
      .populate('subjectId', 'name slug color')
      .populate('chapterId', 'name slug');

    return res.status(200).json({
      success: true,
      message: 'Test record updated successfully.',
      test: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update test record.',
    });
  }
};

export const deleteTest = async (req, res) => {
  try {
    const userId = req.user._id;
    const test = await Test.findOneAndDelete({ _id: req.params.testId, userId });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test record not found or access denied.',
      });
    }

    // Also delete any child breakdowns if this was a parent test
    if (test.isParent) {
      await TestBreakdown.deleteMany({ parentTestId: test._id });
    }

    return res.status(200).json({
      success: true,
      message: 'Test record deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete test record.',
    });
  }
};

export const getCsvTemplate = async (req, res) => {
  const headers = [
    'testName',
    'testDate',
    'testType',
    'subjectName',
    'chapterName',
    'totalQuestions',
    'attemptedQuestions',
    'correctAnswers',
    'incorrectAnswers',
    'unattemptedQuestions',
    'marksObtained',
    'maxMarks',
    'durationSeconds',
    'notes',
  ];

  const sampleRows = [
    [
      'Aptitude Speed Test 1',
      '2026-03-01',
      'chapter',
      'Quantitative Aptitude',
      'Percentage',
      25,
      22,
      19,
      3,
      3,
      35,
      50,
      1800,
      'Focused on quick fraction conversions',
    ],
    [
      'Logical Reasoning Mock A',
      '2026-03-02',
      'chapter',
      'Logical Reasoning',
      'Seating Arrangement',
      20,
      18,
      16,
      2,
      2,
      30,
      40,
      1500,
      'Linear and circular puzzles practice',
    ],
  ];

  const csvContent = stringify([headers, ...sampleRows]);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="preptrack_test_import_template.csv"');
  return res.status(200).send(csvContent);
};

export const importCsvTests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { csvData } = req.body;

    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide CSV data content.',
      });
    }

    let records;
    try {
      records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        message: `CSV parsing error: ${parseErr.message}`,
      });
    }

    if (!records || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded CSV file is empty.',
      });
    }

    const subjects = await Subject.find({});
    const chapters = await Chapter.find({});

    const subjectMap = new Map(subjects.map((s) => [s.name.toLowerCase(), s._id]));
    const chapterMap = new Map(chapters.map((c) => [c.name.toLowerCase(), c._id]));

    const validationErrors = [];
    const validTestsToInsert = [];

    records.forEach((row, index) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header line
      const {
        testName,
        testDate,
        testType = 'chapter',
        subjectName,
        chapterName,
        totalQuestions,
        attemptedQuestions,
        correctAnswers,
        incorrectAnswers,
        unattemptedQuestions,
        marksObtained,
        maxMarks,
        durationSeconds = 0,
        notes = '',
      } = row;

      if (!testName) {
        validationErrors.push({ row: rowNum, error: 'Test name is required.' });
        return;
      }

      const totalQ = parseInt(totalQuestions, 10);
      const attQ = parseInt(attemptedQuestions, 10);
      const corrA = parseInt(correctAnswers, 10);
      const incorrA = parseInt(incorrectAnswers, 10);
      const unattQ = parseInt(unattemptedQuestions, 10);
      const marks = parseFloat(marksObtained);
      const maxM = parseFloat(maxMarks);
      const durSec = parseInt(durationSeconds, 10) || 0;

      if (isNaN(totalQ) || totalQ < 1) {
        validationErrors.push({ row: rowNum, error: 'Total questions must be a positive integer.' });
        return;
      }
      if (isNaN(attQ) || attQ < 0 || isNaN(corrA) || corrA < 0 || isNaN(incorrA) || incorrA < 0 || isNaN(unattQ) || unattQ < 0) {
        validationErrors.push({ row: rowNum, error: 'Question counts must be valid non-negative numbers.' });
        return;
      }
      if (attQ !== corrA + incorrA) {
        validationErrors.push({ row: rowNum, error: `Attempted (${attQ}) must equal correct (${corrA}) + incorrect (${incorrA}).` });
        return;
      }
      if (totalQ !== attQ + unattQ) {
        validationErrors.push({ row: rowNum, error: `Total (${totalQ}) must equal attempted (${attQ}) + unattempted (${unattQ}).` });
        return;
      }
      if (corrA > attQ) {
        validationErrors.push({ row: rowNum, error: `Correct answers cannot exceed attempted questions.` });
        return;
      }
      if (isNaN(marks) || isNaN(maxM) || maxM <= 0) {
        validationErrors.push({ row: rowNum, error: `Valid marks and positive max marks are required.` });
        return;
      }
      if (marks > maxM) {
        validationErrors.push({ row: rowNum, error: `Marks obtained (${marks}) cannot exceed maximum marks (${maxM}).` });
        return;
      }

      let subId = null;
      if (subjectName && subjectMap.has(subjectName.toLowerCase())) {
        subId = subjectMap.get(subjectName.toLowerCase());
      }

      let chapId = null;
      if (chapterName && chapterMap.has(chapterName.toLowerCase())) {
        chapId = chapterMap.get(chapterName.toLowerCase());
      }

      validTestsToInsert.push({
        userId,
        testName,
        testDate: testDate ? new Date(testDate) : new Date(),
        testType: ['chapter', 'sectional', 'full_mock', 'previous_year'].includes(testType) ? testType : 'chapter',
        subjectId: subId,
        chapterId: chapId,
        totalQuestions: totalQ,
        attemptedQuestions: attQ,
        correctAnswers: corrA,
        incorrectAnswers: incorrA,
        unattemptedQuestions: unattQ,
        marksObtained: marks,
        maxMarks: maxM,
        durationSeconds: durSec,
        notes,
        isParent: false,
      });
    });

    if (validationErrors.length > 0 && validTestsToInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV validation failed. No rows could be imported.',
        errors: validationErrors,
      });
    }

    let inserted = [];
    if (validTestsToInsert.length > 0) {
      inserted = await Test.insertMany(validTestsToInsert);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${inserted.length} tests.${validationErrors.length > 0 ? ` Skipped ${validationErrors.length} invalid rows.` : ''}`,
      importedCount: inserted.length,
      skippedCount: validationErrors.length,
      errors: validationErrors,
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process CSV import.',
    });
  }
};
