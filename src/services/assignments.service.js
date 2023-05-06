import { ObjectId } from 'mongodb';

import { Assignment } from '../models/assignment.js';
import ApiError from '../helpers/api-error.js';
import testsService from './tests.service.js';
import documentsService from './documents.service.js';
import s3Service from './s3.service.js';

// FIXME This function is not used
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

async function getAssignment(assignmentId, jwtUser, returnCorrectAnswers = false) {
  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    throw new ApiError(
      404,
      'ASSIGNMENT_NOT_FOUND',
      `Assignment not found with id ${assignmentId}.`
    );
  }

  const test = assignment.test;

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

    if (!returnCorrectAnswers) {
      // Remove correct answers
      test.questions = test.questions = test.questions.map((question) => {
        question.answers = question.answers.map((answer) => {
          if (['text', 'selection'].includes(question.type)) {
            answer.answer = null;
          } else {
            answer.correct = false;
          }
          return answer;
        });
        return question;
      });
    }
  }

  const documentDownloadUrl = await s3Service.getDownloadUrl(assignment.test.document.path);

  return { ...assignment.toJSON(), test: { ...test.toJSON(), documentDownloadUrl } };
}

async function getAssignmentTestDocumentDownloadUrl(assignmentId, jwtUser) {
  const { test } = await getAssignment(assignmentId, jwtUser);

  return test.documentDownloadUrl;
}

async function createAssignment(groupId, data) {
  const { name, startDate, endDate, testId: testTemplateId } = data;

  let assignmentData = { groupId, name };
  if (startDate) {
    assignmentData.startDate = startDate;
  }
  if (endDate) {
    assignmentData.endDate = endDate;
  }
  if (startDate && endDate && startDate >= endDate) {
    throw new ApiError(400, 'INVALID_DATES', 'Start date cannot be after end date.');
  }

  const testTemplate = await testsService.getTest(testTemplateId);
  assignmentData.test = {
    templateId: testTemplateId,
    ...testTemplate,
  };

  return Assignment.create(assignmentData);
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

  return Assignment.findOneAndUpdate({ _id: assignmentId }, assignmentData, {
    new: true,
    runValidators: true,
  });
}

async function updateAssignmentTest(assignmentId, newTestData) {
  const { name, questions } = newTestData;

  const updatedAssignment = await Assignment.findOneAndUpdate(
    { _id: assignmentId },
    {
      'test.name': name,
      'test.questions': questions,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return updatedAssignment;
}

async function updateAssignmentTestDocument(assignmentId, newDocument) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new ApiError(
      404,
      'ASSIGNMENT_NOT_FOUND',
      `Assignment not found with id ${assignmentId}.`
    );
  }

  newDocument.path = documentsService.getDocumentPath(assignment.test.templateId, newDocument.name);
  const documentUploadUrl = await s3Service.getUploadUrl(newDocument.path, newDocument.type);

  await _deleteAssignmentDocument(assignmentId, assignment.test.document.path);

  assignment.test.document = newDocument;
  await assignment.save();

  return { ...assignment.toJSON(), documentUploadUrl };
}

async function resetAssignmentTest(assignmentId) {
  const assignment = await Assignment.findById(assignmentId);

  const templateId = assignment.test.templateId;
  const template = await testsService.getTest(templateId);
  const { name, document, questions } = template;

  const updatedAssignment = await Assignment.findOneAndUpdate(
    { _id: assignmentId },
    {
      'test.name': name,
      'test.document': document,
      'test.questions': questions,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (assignment.test.path !== updatedAssignment.test.path) {
    await _deleteAssignmentDocument(assignmentId, assignment.test.path);
  }

  return updatedAssignment;
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

  await _deleteAssignmentDocument(assignmentId, assignment.test.document.path);

  await Assignment.deleteOne({ _id: assignment });
}

async function _deleteAssignmentDocument(assignmentId, documentPath) {
  const doAnyAssignmentsUseDocument = await Assignment.exists({
    _id: { $ne: assignmentId },
    'test.document.path': documentPath,
  });
  const doAnyTemplatesUseDocument = await testsService.doAnyTestsUseDocumentAtPath(documentPath);

  if (!doAnyAssignmentsUseDocument && !doAnyTemplatesUseDocument) {
    try {
      await s3Service.deleteDocument(documentPath);
    } catch (error) {
      throw new ApiError(500, 'DELETE_DOCUMENT_ERROR', error.message);
    }
  }
}

async function doAnyAssignmentsUseDocumentAtPath(path) {
  return Assignment.exists({ 'test.document.path': path });
}

export default {
  getAssignments,
  getAssignment,
  getAssignmentTestDocumentDownloadUrl,
  createAssignment,
  updateAssignment,
  updateAssignmentTest,
  updateAssignmentTestDocument,
  resetAssignmentTest,
  deleteAssignment,
  doAnyAssignmentsUseDocumentAtPath,
};
