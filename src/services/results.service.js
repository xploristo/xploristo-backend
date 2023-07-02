import { ObjectId } from 'mongodb';

import { Result } from '../models/result.js';
import ApiError from '../helpers/api-error.js';
import assignmentsService from '../services/assignments.service.js';

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
  const assignment = await assignmentsService.getAssignment(assignmentId, jwtUser, true);
  const { test, result: existingResult } = assignment;
  if (existingResult) {
    throw new ApiError(
      400,
      'ALREADY_COMPLETED_ASSIGNMENT',
      'This assignment was already completed.'
    );
  }

  const isDateWithinInterval = ({ startDate, endDate }, date = new Date()) => {
    if (!startDate && !endDate) return true;
    if (!startDate) return date < new Date(endDate);
    if (!endDate) return date > new Date(startDate);
    return date > new Date(startDate) && date < new Date(endDate);
  };
  if (!isDateWithinInterval(assignment)) {
    throw new ApiError(400, 'UNAVAILABLE_ASSIGNMENT', 'This assignment is not available.');
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
        if (isAnswerCorrect) {
          score += 1;
          correctAnswersCount += 1;
        }
      }
      question.answers = answers.map((answer) => {
        const testAnswer = testQuestion.answers.find(
          (testAnswer) => testAnswer.index === answer.index
        );
        answer.correctAnswer = {
          correct: testAnswer.correct === answer.correct,
          value: testAnswer.correct,
        };
        return answer;
      });
    } else if (type === 'selection') {
      const totalAnswers = answers.length;
      const totalExpectedAnswers = testQuestion.answers.length;
      let correctSelectionsCount = 0;

      const testAnswers = [...testQuestion.answers];

      answers.forEach((studentAnswer, index) => {
        // TODO Better comparison
        const testAnswerIndex = testQuestion.answers.findIndex(
          (testAnswer) => testAnswer.answer.textSelection === studentAnswer.answer.textSelection
        );
        const isAnswerCorrect = testAnswerIndex !== -1;
        question.answers[index].isAnswerCorrect = isAnswerCorrect;

        if (isAnswerCorrect) {
          correctSelectionsCount++;
          testAnswers.splice(testAnswerIndex, 1);
        }
      });

      question.missingAnswers = testAnswers;

      const pointsByCorrectSelection = 1 / totalExpectedAnswers;
      const pointsByIncorrectSelection = pointsByCorrectSelection;
      const incorrectSelectionsCount = totalAnswers - correctSelectionsCount;
      const questionScore =
        pointsByCorrectSelection * correctSelectionsCount -
        pointsByIncorrectSelection * incorrectSelectionsCount;
      score += questionScore;

      if (questionScore === 1) {
        correctAnswersCount += 1;
      }
    } else {
      const studentAnswer = answers[0];
      const correctAnswer = testQuestion.answers[0];

      isAnswerCorrect = studentAnswer.answer === correctAnswer.answer;
      if (isAnswerCorrect) {
        score += 1;
        correctAnswersCount += 1;
      }
      question.answers[0].correctAnswer = {
        correct: isAnswerCorrect,
        value: correctAnswer.answer,
      };
    }
  });
  score = (score / test.questions.length) * 10;

  const result = await Result.create({
    assignmentId,
    groupId: assignment.groupId,
    userId,
    questions,
    score,
    correctAnswersCount,
  });

  await assignmentsService.incrementAssignmentResultCount(assignmentId);

  return result;
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

/**
 * Deletes all given student's results for provided group.
 *
 * @param {string} userId  The user's id.
 * @param {string} groupId The group's id.
 */
async function deleteStudentResults(userId, groupId) {
  const results = await Result.find({ userId, groupId });

  await Promise.all(
    results.map((result) => assignmentsService.decrementAssignmentResultCount(result.assignmentId))
  );

  await Result.deleteMany({ userId, groupId });
}

export default {
  getResults,
  createResult,
  getResult,
  deleteStudentResults,
};
