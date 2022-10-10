import { ObjectId } from 'mongodb';

import { Result } from '../models/result.js';
import ApiError from '../helpers/api-error.js';
import groupsService from '../services/groups.service.js';

async function getResults(jwtUser) {
  let query = {};
  if (jwtUser.role === 'student') {
    query.userId = ObjectId(jwtUser.userId);
  }
  const results = await Result.find(query);
  return results;
}

async function createResult(data, jwtUser) {
  const { userId } = jwtUser;
  const { assignmentId, questions } = data;
  const { test, result: existingResult } = await groupsService.getAssignment(assignmentId, jwtUser);
  if (existingResult) {
    throw new ApiError(400, 'ALREADY_COMPLETED_TEST', 'This test was already completed.');
  }

  let score = 0;
  let correctAnswersCount = 0;
  questions.forEach((question) => {
    let isAnswerCorrect = false;
    const testQuestion = test.questions.find(
      (testQuestion) => testQuestion.index === question.index
    );

    if (['singleChoice', 'multiChoice'].includes(question.type)) {
      const studentAnswers = question.answers.filter((answer) => answer.correct);
      const correctAnswers = testQuestion.answers.filter((answer) => answer.correct);

      if (studentAnswers.length === correctAnswers.length) {
        isAnswerCorrect = correctAnswers.every((correctAnswer) =>
          studentAnswers.find((studentAnswer) => studentAnswer.index === correctAnswer.index)
        );
      }
    } else {
      const studentAnswer = question.answers[0];
      const correctAnswer = testQuestion.answers[0];

      // TODO Better comparison
      if (question.type === 'selection') {
        isAnswerCorrect = studentAnswer.answer.textSelection === correctAnswer.answer.textSelection;
      } else if (question.type === 'text') {
        isAnswerCorrect = studentAnswer.answer === correctAnswer.answer;
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
