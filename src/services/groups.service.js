import { ObjectId } from 'mongodb';

import { Group } from '../models/group.js';
import usersService from './users.service.js';
import ApiError from '../helpers/api-error.js';

async function getGroup(groupId, jwtUser, populate = true) {
  if (!populate) {
    const group = await Group.findById(groupId);
    if (!group || (jwtUser.role === 'student' && !group.isVisible)) {
      throw new ApiError(404, 'GROUP_NOT_FOUND', `Group not found with id ${groupId}.`);
    }
    return group;
  }

  // TODO Paginate

  const assignmentAggregate = [
    {
      $match: {
        $expr: { $eq: ['$groupId', '$$groupId'] },
      },
    },
  ];
  let usersAggregate = [];
  if (jwtUser.role === 'student') {
    assignmentAggregate.push(
      {
        $match: {
          $expr: { $eq: ['$isVisible', true] },
        },
      },
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
        $unset: ['teacherIds', 'studentIds', 'teachers.credentialsId', 'students.credentialsId'],
      },
    ];
  }

  const role = jwtUser.role;
  const roleMatch =
    role === 'admin'
      ? {}
      : role === 'teacher'
      ? { $expr: { $in: [ObjectId(jwtUser.userId), '$teacherIds'] } }
      : { $expr: { $in: [ObjectId(jwtUser.userId), '$studentIds'] }, isVisible: true };
  const aggregate = [
    {
      $match: {
        _id: ObjectId(groupId),
        ...roleMatch,
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
      : { studentIds: ObjectId(userId), isVisible: true };

  const groups = await Group.find(query).sort({ updatedAt: -1 });

  return groups;
}

async function createGroup(data, teacherId) {
  let { name, isVisible } = data;
  const teacherIds = [teacherId];

  const group = await Group.create({ name, isVisible, teacherIds });

  return group;
}

async function updateGroup(groupId, data) {
  let { name, isVisible } = data;

  const group = await Group.findOneAndUpdate(
    { _id: groupId },
    { name, isVisible },
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

  await Group.deleteOne({ _id: groupId });
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

/**
 * Enrolls provided students to given group.
 *
 * @param {string}   groupId  The group's id.
 * @param {[object]} students Students to enroll.
 * @param {object}   jwtUser  Requester's JWT user.
 *
 * @returns Populated group.
 */
async function enrollStudents(groupId, students, jwtUser) {
  const studentIds = await Promise.all(
    students.map(async (student) => {
      const user = await usersService.enrollStudent(groupId, student);
      return user._id;
    })
  );

  await Group.findOneAndUpdate(
    { _id: groupId },
    {
      $addToSet: {
        studentIds: { $each: studentIds },
      },
    },
    { new: true }
  );

  return getGroup(groupId, jwtUser);
}

async function addTeacherToGroup(groupId, teacherEmail) {
  // TODO ACL
  const teacher = await usersService.getUserByEmail(teacherEmail, 'teacher');

  return Group.findOneAndUpdate(
    { _id: groupId },
    {
      $addToSet: {
        teacherIds: teacher._id,
      },
    },
    { new: true }
  ).populate({ path: 'teachers', select: '-credentialsId' });
}

async function deleteTeacherFromGroup(groupId, teacherId) {
  // TODO ACL
  return Group.findOneAndUpdate(
    { _id: groupId },
    {
      $pull: {
        teacherIds: teacherId,
      },
    },
    { new: true }
  ).populate({ path: 'teachers', select: '-credentialsId' });
}

export default {
  getGroup,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  enrollStudents,
  removeUserFromGroups,
  addTeacherToGroup,
  deleteTeacherFromGroup,
};
