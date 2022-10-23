import s3Service from './s3.service.js';
import { Test } from '../models/test.js';
import ApiError from '../helpers/api-error.js';

// TODO Should documents be saved to a separate collection and be reusable between tests?

const documentPath = (testId, path) => `${testId}/${path}`;

async function getTests() {
  const tests = await Test.find({});
  return tests;
}

async function createTest(data) {
  const { name, document } = data;
  const { path, type: documentType } = document;

  const test = await Test.create({ name, document });
  const testId = test._id;

  let documentUploadUrl;
  try {
    documentUploadUrl = await s3Service.getUploadUrl(documentPath(testId, path), documentType);
  } catch (error) {
    await Test.deleteOne({ _id: testId });

    throw new ApiError(500, 'UPLOAD_URL_ERROR', error.message);
  }

  return { ...test.toJSON(), documentUploadUrl };
}

async function updateTest(testId, data) {
  const { name, questions } = data;

  const test = await Test.findOneAndUpdate({ _id: testId }, { name, questions });
  return test;
}

async function updateTestDocument(testId, document) {
  const { path, type: documentType } = document;

  try {
    const documentUploadUrl = await s3Service.getUploadUrl(
      documentPath(testId, path),
      documentType
    );

    const oldTest = await Test.findById(testId);
    const oldPath = oldTest.document.path;
    await s3Service.deleteDocument(documentPath(testId, oldPath));

    const test = await Test.findOneAndUpdate({ _id: testId }, { document });

    return { ...test.toJSON(), documentUploadUrl };
  } catch (error) {
    throw new ApiError(500, 'UPDATE_DOCUMENT_ERROR', error.message);
  }
}

async function getTest(testId, jwtUser) {
  const test = await Test.findById(testId);
  if (!test) {
    throw new ApiError(404, 'TEST_NOT_FOUND', `Test not found with id ${testId}.`);
  }
  if (jwtUser.role === 'student') {
    test.questions = test.questions.map((question) => {
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
  const path = test.document.path;

  const documentDownloadUrl = await s3Service.getDownloadUrl(documentPath(testId, path));

  return { ...test.toJSON(), documentDownloadUrl };
}

async function deleteTest(testId) {
  const test = await Test.findById(testId);
  if (!test) {
    throw new ApiError(404, 'TEST_NOT_FOUND', `Test not found with id ${testId}.`);
  }

  try {
    const path = test.document.path;
    await s3Service.deleteDocument(documentPath(testId, path));

    await Test.remove({ _id: testId });
  } catch (error) {
    throw new ApiError(500, 'DELETE_TEST_ERROR', error.message);
  }
}

export default {
  getTests,
  createTest,
  updateTest,
  updateTestDocument,
  getTest,
  deleteTest,
};
