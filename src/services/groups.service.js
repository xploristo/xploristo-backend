import { ObjectId } from 'mongodb';

import { Group } from '../models/group.js';
import { Assignment } from '../models/assignment.js';
import usersService from './users.service.js';
import ApiError from '../helpers/api-error.js';

async function getGroup(groupId, jwtUser) {
  const assignmentAggregate = [
    {
      $match: {
        $expr: { $eq: ['$groupId', '$$groupId'] },
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
  ];
  if (jwtUser.role === 'student') {
    assignmentAggregate.push(
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
  } else {
    assignmentAggregate.push({
      $lookup: {
        from: 'results',
        let: { assignmentId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$assignmentId', '$$assignmentId'] },
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
        ],
        as: 'results',
      },
    });
  }
  const aggregate = [
    {
      $match: {
        _id: ObjectId(groupId),
      },
    },
    {
      $lookup: {
        from: 'assignments',
        let: { groupId: '$_id' },
        pipeline: assignmentAggregate,
        as: 'assignments',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'teacherIds',
        foreignField: '_id',
        as: 'teachers',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'studentIds',
        foreignField: '_id',
        as: 'students',
      },
    },
    {
      $unset: ['teacherIds', 'studentIds'],
    },
  ];
  const result = await Group.aggregate(aggregate);

  if (result && result.length) {
    return result[0];
  }

  throw new ApiError(404, 'GROUP_NOT_FOUND', `Group not found with id ${groupId}.`);
}

async function getGroups(userId) {
  const groups = await Group.find({
    $or: [{ teacherIds: ObjectId(userId) }, { studentIds: ObjectId(userId) }],
  }).sort({ updatedAt: -1 });

  return groups;
}

async function createGroup(data, teacherId) {
  let { name } = data;
  const teacherIds = [teacherId];

  const group = await Group.create({ name, teacherIds });

  return group;
}

async function updateGroup(groupId, data) {
  let { name } = data;

  const group = await Group.findOneAndUpdate(
    { _id: groupId },
    { name },
    { new: true, upsert: true }
  );
  return group;
}

async function deleteGroup(groupId) {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new ApiError(404, 'GROUP_NOT_FOUND', `Group not found with id ${groupId}.`);
  }
  await usersService.removeStudentsFromGroup(groupId);

  await Group.remove({ _id: groupId });
}

async function removeUserFromGroups(userId) {
  return await Group.updateMany(
    {
      $match: {
        $expr: {
          $or: [{ teacherIds: ObjectId(userId) }, { studentIds: ObjectId(userId) }],
        },
      },
    },
    {
      $pull: { teacherIds: ObjectId(userId), studentIds: ObjectId(userId) },
    }
  );
}

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

async function enrollStudents(groupId, data) {
  // TODO receive csv
  const { students } = data;

  const studentIds = await Promise.all(
    students.map(async (student) => {
      const user = await usersService.enrollStudent(groupId, student);
      return user._id;
    })
  );

  const group = await Group.findOneAndUpdate(
    { _id: groupId },
    {
      $addToSet: {
        studentIds: { $each: studentIds },
      },
    },
    { new: true }
  );

  return group;
}

export default {
  getGroup,
  getGroups,
  createGroup,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  deleteGroup,
  getAssignments,
  getAssignment,
  enrollStudents,
  updateGroup,
  removeUserFromGroups,
};
