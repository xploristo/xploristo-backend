import { Group } from '../models/group.js';
import { Assignment } from '../models/assignment.js';
import usersService from './users.service.js';

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

  return group;
}

async function createAssignment(groupId, data) {
  const { endDate, testId } = data;
  let assignmentData = {
    groupId,
    testId
  };
  if (endDate) {
    assignmentData.endDate = endDate;
  }

  const assignment = await Assignment.create(assignmentData);

  return assignment;
}

async function getAssignments(groupId) {
  const assignments = await Assignment.find({ groupId });
  return assignments;
}

async function enrollStudents(groupId, data) {
  // TODO receive csv
  const { students } = data;
  let studentIds;

  await Promise.all(students.map(async (student) => {
    const { email } = student;
    const user = await usersService.findOneAndUpdate({ email }, { ...student, role: 'student' }, { upsert: true });
    studentIds.push(user._id);
  }));

  const group = await Group.findOneAndUpdate(groupId, {
    $addToSet: {
      studentIds: { $each: studentIds } 
    },
  });

  return group;
}

export default {
  getGroup,
  getGroups,
  createGroup,
  createAssignment,
  getAssignments,
  enrollStudents,
};
