import { ObjectId } from 'mongodb';

import { Assignment } from '../models/assignment.js';
import ApiError from '../helpers/api-error.js';
import testsService from './tests.service.js';

async function createAssignment(groupId, data) {
  const { name, startDate, endDate, testId } = data;
  let assignmentData = {
    name,
    groupId,
    testId,
  };
  if (startDate) {
    assignmentData.startDate = startDate;
  }
  if (endDate) {
    assignmentData.endDate = endDate;
  }
  if (startDate && endDate && startDate >= endDate) {
    throw new ApiError(400, 'INVALID_DATES', 'Start date cannot be after end date.');
  }

  const assignment = await Assignment.create(assignmentData);

  const test = await testsService.getTest(testId);
  return {
    ...assignment.toJSON(),
    test: { _id: test._id, name: test.name, document: test.document },
  };
}

async function updateAssignment(assignmentId, data) {
  const { name, startDate, endDate } = data;
  let assignmentData = {
    name,
  };
  if (startDate) {
    assignmentData.startDate = startDate;
  }
  if (endDate) {
    assignmentData.endDate = endDate;
  }
  if (startDate && endDate && startDate >= endDate) {
    throw new ApiError(400, 'INVALID_DATES', 'Start date cannot be after end date.');
  }

  const assignment = await Assignment.findOneAndUpdate({ _id: assignmentId }, assignmentData, {
    new: true,
    upsert: true,
  });

  const test = await testsService.getTest(assignment.testId);
  return {
    ...assignment.toJSON(),
    test: { _id: test._id, name: test.name, document: test.document },
  };
}

async function deleteAssignment(assignmentId) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new ApiError(
      404,
      'ASSIGNMENT_NOT_FOUND',
      `Assignment not found with id ${assignmentId}.`
    );
  }

  await Assignment.deleteOne({ _id: assignment });
}

// TODO This service's function is not used
async function getAssignments(groupId, jwtUser) {
  const aggregate = [
    {
      $match: {
        groupId: ObjectId(groupId),
      },
    },
    {
      $lookup: {
        from: 'tests',
        localField: 'testId',
        foreignField: '_id',
        as: 'test',
      },
    },
    {
      $unwind: {
        path: '$test',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
  if (jwtUser.role === 'student') {
    aggregate.push(
      {
        $lookup: {
          from: 'results',
          let: { assignmentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$assignmentId', '$$assignmentId'] },
                    { $eq: ['$userId', ObjectId(jwtUser.userId)] },
                  ],
                },
              },
            },
          ],
          as: 'result',
        },
      },
      {
        $unwind: {
          path: '$result',
          preserveNullAndEmptyArrays: true,
        },
      }
    );
  }
  const result = await Assignment.aggregate(aggregate);

  return result;
}

async function getAssignment(assignmentId, jwtUser) {
  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    throw new ApiError(
      404,
      'ASSIGNMENT_NOT_FOUND',
      `Assignment not found with id ${assignmentId}.`
    );
  }

  if (jwtUser.role === 'student') {
    const isDateWithinInterval = ({ startDate, endDate }, date = new Date()) => {
      if (!startDate && !endDate) return true;
      if (!startDate) return date < new Date(endDate);
      if (!endDate) return date > new Date(startDate);
      return date > new Date(startDate) && date < new Date(endDate);
    };
    if (!isDateWithinInterval(assignment)) {
      throw new ApiError(400, 'UNAVAILABLE_ASSIGNMENT', 'This assignment is not available.');
    }
  }

  // TODO Do we need full test?
  const test = await testsService.getTest(assignment.testId, jwtUser);

  return { ...assignment.toJSON(), test };
}

export default {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignments,
  getAssignment,
};
