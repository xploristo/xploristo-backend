import { Group } from '../models/group.js';
import { Assignment } from '../models/assignment.js';

async function getGroups(userId) {
  const groups = await Group.aggregate([
    {
      $match: {
        $or: [
          {
            teacherIds: userId,
            studentIds: userId,
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

  return group;
}

async function createAssignment(groupId, data) {
  let { endDate, testIds = [] } = data;
  let assignmentData = {
    groupId,
    testIds
  };
  if (endDate) {
    assignmentData.endDate = endDate;
  }

  const assignment = await Assignment.create(assignmentData);

  return assignment;
}

export default {
  getGroups,
  createGroup,
  createAssignment,
};
