import { ObjectId } from 'mongodb';

import { Result } from '../models/result.js';
import ApiError from '../helpers/api-error.js';
import groupsService from '../services/groups.service.js';

async function getResults(jwtUser) {
  let query = {};
  if (jwtUser.role === 'student') {
    query.userId = ObjectId(jwtUser.userId);
  }
  const results = await Result.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: 'assignments',
        let: { assignmentId: '$assignmentId' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$_id', '$$assignmentId'] },
            },
          },
          {
            $lookup: {
              from: 'tests',
              let: { testId: '$testId' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$_id', '$$testId'] },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    document: 1,
                  },
                },
              ],
              as: 'test',
            },
          },
          {
            $unwind: {
              path: '$test',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
        as: 'assignment',
      },
    },
    {
      $unwind: {
        path: '$assignment',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);
  return results;
}

async function createResult(data, jwtUser) {
  const { userId } = jwtUser;
  const { assignmentId, questions } = data;
  const {
    test,
    result: existingResult,
    startDate,
    endDate,
  } = await groupsService.getAssignment(assignmentId, jwtUser);
  if (existingResult) {
    throw new ApiError(400, 'ALREADY_COMPLETED_TEST', 'This test was already completed.');
  }
  if (new Date() < new Date(startDate) || new Date() > new Date(endDate)) {
    throw new ApiError(400, 'UNAVAILABLE_TEST', 'This test is not available.');
  }

  let score = 0;
  let correctAnswersCount = 0;
  questions.forEach((question) => {
    const { answers, type, index } = question;
    let isAnswerCorrect = false;
    const testQuestion = test.questions.find((testQuestion) => testQuestion.index === index);

    if (['singleChoice', 'multiChoice'].includes(type)) {
      const studentAnswers = answers.filter((answer) => answer.correct);
      const correctAnswers = testQuestion.answers.filter((answer) => answer.correct);

      if (studentAnswers.length === correctAnswers.length) {
        isAnswerCorrect = correctAnswers.every((correctAnswer) =>
          studentAnswers.find((studentAnswer) => studentAnswer.index === correctAnswer.index)
        );
      }
      question.answers = answers.map((answer) => {
        const testAnswer = testQuestion.answers.find(
          (testAnswer) => testAnswer.index === answer.index
        );
        answer.correctAnswer = {
          correct: testAnswer.correct === answer.correct,
          value: testAnswer.correct,
        };
      });
    } else {
      const studentAnswer = answers[0];
      const correctAnswer = testQuestion.answers[0];

      // TODO Better comparison
      if (type === 'selection') {
        isAnswerCorrect = studentAnswer.answer.textSelection === correctAnswer.answer.textSelection;
        question.answers[0].correctAnswer = {
          correct: isAnswerCorrect,
          value: correctAnswer.answer.textSelection,
        };
      } else if (type === 'text') {
        isAnswerCorrect = studentAnswer.answer === correctAnswer.answer;
        question.answers[0].correctAnswer = {
          correct: isAnswerCorrect,
          value: correctAnswer.answer,
        };
      }
    }

    if (isAnswerCorrect) {
      score += 1;
      correctAnswersCount += 1;
    }
  });
  score = (score / test.questions.length) * 10;

  return Result.create({
    assignmentId,
    userId,
    questions,
    score,
    correctAnswersCount,
  });
}

async function getResult(resultId) {
  const result = await Result.aggregate([
    {
      $match: {
        _id: ObjectId(resultId),
      },
    },
    {
      $lookup: {
        from: 'assignments',
        let: { assignmentId: '$assignmentId' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$_id', '$$assignmentId'] },
            },
          },
          {
            $lookup: {
              from: 'tests',
              let: { testId: '$testId' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$_id', '$$testId'] },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    document: 1,
                  },
                },
              ],
              as: 'test',
            },
          },
          {
            $unwind: {
              path: '$test',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
        as: 'assignment',
      },
    },
    {
      $unwind: {
        path: '$assignment',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);

  if (result && result.length) {
    return result[0];
  }

  throw new ApiError(404, 'RESULT_NOT_FOUND', `Result not found with id ${resultId}.`);
}

export default {
  getResults,
  createResult,
  getResult,
};
