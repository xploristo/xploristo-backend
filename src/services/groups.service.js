import { ObjectId } from 'mongodb';

import { Group } from '../models/group.js';
import usersService from './users.service.js';
import ApiError from '../helpers/api-error.js';

async function getGroup(groupId, jwtUser, populate = true) {
  if (!populate) {
    return await Group.findById(groupId);
  }

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
  let usersAggregate = [];
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
    usersAggregate = [
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
    ...usersAggregate,
  ];
  const result = await Group.aggregate(aggregate);

  if (result && result.length) {
    return result[0];
  }

  throw new ApiError(404, 'GROUP_NOT_FOUND', `Group not found with id ${groupId}.`);
}

async function getGroups(jwtUser) {
  const { userId, role } = jwtUser;
  const query =
    role === 'admin'
      ? {}
      : role === 'teacher'
      ? { teacherIds: ObjectId(userId) }
      : { studentIds: ObjectId(userId) };

  const groups = await Group.find(query).sort({ updatedAt: -1 });

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
  updateGroup,
  deleteGroup,
  enrollStudents,
  removeUserFromGroups,
};
