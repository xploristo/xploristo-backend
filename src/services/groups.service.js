import { Group } from '../models/group.js';

async function createGroup(data, teacherId) {
  let { name, teacherIds = [] } = data;
  teacherIds.push(teacherId);
  teacherIds = [...new Set(teacherIds)];

  const group = await Group.create({ name, teacherIds });

  return group;
}

export default {
  createGroup,
};
