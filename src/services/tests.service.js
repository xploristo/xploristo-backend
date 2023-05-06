import s3Service from './s3.service.js';
import ApiError from '../helpers/api-error.js';
import assignmentsService from './assignments.service.js';
import documentsService from './documents.service.js';
import { Test } from '../models/test.js';

/**
 * Returns all tests in descending update date order.
 *
 * // TODO Only return tests requesting user has access to
 */
async function getTests() {
  const tests = await Test.find({}).sort({ updatedAt: -1 });
  return tests;
}

/**
 * Returns requested test (with a pre-signed document download url).
 *
 * @param {string} testId  The test's id.
 * @param {object} jwtUser Requesting user's data.
 */
async function getTest(testId) {
  const test = await Test.findById(testId);
  if (!test) {
    throw new ApiError(404, 'TEST_NOT_FOUND', `Test not found with id ${testId}.`);
  }

  const documentDownloadUrl = await s3Service.getDownloadUrl(test.document.path);

  return { ...test.toJSON(), documentDownloadUrl };
}

async function getTestDocumentDownloadUrl(testId) {
  const { documentDownloadUrl } = await getTest(testId);

  return documentDownloadUrl;
}

/**
 * Creates a new test with provided name and document (name, path, type). A document
 * upload pre-signed url is returned to allow the client to upload the document to S3.
 *
 * @param {object} testData The test data.
 */
async function createTest(testData) {
  const { name, document } = testData;

  const test = new Test({ name, document });

  const documentPath = documentsService.getDocumentPath(test._id, document.name);

  let documentUploadUrl;
  try {
    documentUploadUrl = await s3Service.getUploadUrl(documentPath, document.type);
  } catch (error) {
    await Test.deleteOne({ _id: test._id });

    throw new ApiError(500, 'UPLOAD_URL_ERROR', error.message);
  }

  test.document.path = documentPath;
  await test.save();

  return { ...test.toJSON(), documentUploadUrl };
}

async function updateTest(testId, data) {
  const { name, questions } = data;

  const test = await Test.findOneAndUpdate({ _id: testId }, { name, questions });
  return test;
}

/**
 * Updates given test's document. If previous test's document is not used by any other
 * test or assignment, the document is deleted from S3. A document upload pre-signed url
 * is returned to allow the client to upload the new document to S3.
 *
 * @param {string} testId      The test's id.
 * @param {object} newDocument New document data.
 */
async function updateTestDocument(testId, newDocument) {
  const test = await Test.findById(testId);
  if (!test) {
    throw new ApiError(404, 'TEST_NOT_FOUND', `Test not found with id ${testId}.`);
  }

  newDocument.path = documentsService.getDocumentPath(testId, newDocument.name);
  const documentUploadUrl = await s3Service.getUploadUrl(newDocument.path, newDocument.type);

  await _deleteTestDocument(testId, test.document.path);

  test.document = newDocument;
  await test.save();

  return { ...test.toJSON(), documentUploadUrl };
}

/**
 * Deletes given test. If the test's document is not used by any other test or
 * assignment, the document is deleted from S3.
 *
 * @param {string} testId The test's id.
 */
async function deleteTest(testId) {
  const test = await Test.findById(testId);
  if (!test) {
    throw new ApiError(404, 'TEST_NOT_FOUND', `Test not found with id ${testId}.`);
  }

  await _deleteTestDocument(testId, test.document.path);

  await Test.deleteOne({ _id: testId });
}

/**
 * Deletes document at given path from S3 if it is not used by any other test or assignment.
 *
 * @param {string} testId       The test we are trying to delete document from.
 * @param {string} documentPath Document path inside bucket.
 */
async function _deleteTestDocument(testId, documentPath) {
  const doAnyTemplatesUseDocument = await Test.exists({
    _id: { $ne: testId },
    'document.path': documentPath,
  });
  const doAnyAssignmentsUseDocument = await assignmentsService.doAnyAssignmentsUseDocumentAtPath(
    documentPath
  );

  if (!doAnyTemplatesUseDocument && !doAnyAssignmentsUseDocument) {
    try {
      await s3Service.deleteDocument(documentPath);
    } catch (error) {
      throw new ApiError(500, 'DELETE_DOCUMENT_ERROR', error.message);
    }
  }
}

async function doAnyTestsUseDocumentAtPath(path) {
  return Test.exists({ 'document.path': path });
}

export default {
  getTests,
  getTest,
  getTestDocumentDownloadUrl,
  createTest,
  updateTest,
  updateTestDocument,
  deleteTest,
  doAnyTestsUseDocumentAtPath,
};
