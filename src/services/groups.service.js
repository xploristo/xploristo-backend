import { Group } from '../models/group.js';
import { Assignment } from '../models/assignment.js';

async function getGroup(groupId) {
  const group = await Group.aggregate([
    {
      $match: {
        _id: groupId
      }
    },
    {
      $lookup: {
        from: 'assignments',
        localField: '_id',
        foreignField: 'groupId',
        as: 'assigments',
      },
    },
    {
      $unwind: {
        path: '$assigments',
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);
  return group;
}

async function getGroups(userId) {
  const groups = await Group.aggregate([
    {
      $match: {
        $or: [
          {
            teacherIds: { $in: userId },
            studentIds: { $in: userId },
          }
        ]
      }
    },
    {
      $lookup: {
        from: 'assignments',
        localField: '_id',
        foreignField: 'groupId',
        as: 'assigments',
      },
    },
    {
      $unwind: {
        path: '$assigments',
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);
  return groups;
}

async function createGroup(data, teacherId) {
  let { name, teacherIds = [] } = data;
  teacherIds.push(teacherId);
  teacherIds = [...new Set(teacherIds)];

  const group = await Group.create({ name, teacherIds });

  return group.toJSON();
}

async function createAssignment(groupId, data) {
  let { endDate, testId } = data;
  let assignmentData = {
    groupId,
    testId
  };
  if (endDate) {
    assignmentData.endDate = endDate;
  }

  const assignment = await Assignment.create(assignmentData);

  return assignment.toJSON();
}

export default {
  getGroup,
  getGroups,
  createGroup,
  createAssignment,
};
