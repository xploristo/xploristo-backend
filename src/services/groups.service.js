import { Group } from '../models/group.js';
import { Assignment } from '../models/assignment.js';

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
  createGroup,
  createAssignment,
};
