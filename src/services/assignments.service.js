import { ObjectId } from 'mongodb';

import { Assignment } from '../models/assignment.js';
import ApiError from '../helpers/api-error.js';

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

  const assignment = await Assignment.create(assignmentData);

  return assignment;
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

  const assignment = await Assignment.findOneAndUpdate({ _id: assignmentId }, assignmentData, {
    new: true,
    upsert: true,
  });
  return assignment;
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

  await Assignment.remove({ _id: assignment });
}

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

  if (result && result.length) {
    return result[0];
  }

  throw new ApiError(404, 'GROUP_NOT_FOUND', `Group not found with id ${groupId}.`);
}

async function getAssignment(assignmentId, jwtUser) {
  const aggregate = [
    {
      $match: {
        _id: ObjectId(assignmentId),
      },
    },
    // TODO Do we need full test?
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

  if (result && result.length) {
    return result[0];
  }

  throw new ApiError(404, 'ASSIGNMENT_NOT_FOUND', `Assignment not found with id ${assignmentId}.`);
}

export default {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignments,
  getAssignment,
};
