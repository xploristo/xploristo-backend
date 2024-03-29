import { Assignment } from '../models/assignment.js';
import ApiError from '../helpers/api-error.js';
import testsService from './tests.service.js';
import documentsService from './documents.service.js';
import s3Service from './s3.service.js';

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
    if (!assignment.isVisible || !isDateWithinInterval(assignment)) {
      throw new ApiError(400, 'UNAVAILABLE_ASSIGNMENT', 'This assignment is not available.');
    }

    if (!returnCorrectAnswers) {
      // Remove correct answers
      test.questions = test.questions = test.questions.map((question) => {
        question.answers =
          question.type === 'selection'
            ? []
            : question.answers.map((answer) => {
                if (question.type === 'text') {
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
  const { name, startDate, endDate, isVisible, testId: testTemplateId } = data;

  let assignmentData = { groupId, name, isVisible };
  if (startDate) {
    assignmentData.startDate = startDate;
  }
  if (endDate) {
    assignmentData.endDate = endDate;
  }
  if (startDate && endDate && startDate >= endDate) {
    throw new ApiError(400, 'INVALID_END_DATE', 'Start date cannot be after end date.'); // TODO
  }

  const testTemplate = await testsService.getTest(testTemplateId);
  assignmentData.test = {
    templateId: testTemplateId,
    ...testTemplate,
  };

  return Assignment.create(assignmentData);
}

async function updateAssignment(assignmentId, data) {
  const { name, startDate, endDate, isVisible } = data;
  let assignmentData = {
    name,
    isVisible,
  };
  if (startDate) {
    assignmentData.startDate = startDate;
  }
  if (endDate) {
    assignmentData.endDate = endDate;
  }
  if (startDate && endDate && startDate >= endDate) {
    throw new ApiError(400, 'INVALID_END_DATE', 'Start date cannot be after end date.');
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

async function resetAssignmentTest(assignmentId, templateId) {
  const assignment = await Assignment.findById(assignmentId);

  templateId = templateId ?? assignment.test.templateId;
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

async function incrementAssignmentResultCount(assignmentId) {
  await Assignment.updateOne({ _id: assignmentId }, { $inc: { resultCount: 1 } });
}

async function decrementAssignmentResultCount(assignmentId) {
  await Assignment.updateOne({ _id: assignmentId }, { $inc: { resultCount: -1 } });
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
      throw new ApiError(500, 'DELETE_DOCUMENT_ERROR', error.message); // TODO
    }
  }
}

async function doAnyAssignmentsUseDocumentAtPath(path) {
  return Assignment.exists({ 'test.document.path': path });
}

export default {
  getAssignment,
  getAssignmentTestDocumentDownloadUrl,
  createAssignment,
  updateAssignment,
  updateAssignmentTest,
  updateAssignmentTestDocument,
  resetAssignmentTest,
  incrementAssignmentResultCount,
  decrementAssignmentResultCount,
  deleteAssignment,
  doAnyAssignmentsUseDocumentAtPath,
};
