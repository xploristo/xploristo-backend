import s3Service from './s3.service.js';
import { Test } from '../models/test.js';
import ApiError from '../helpers/api-error.js';

// TODO Should documents be saved to a separate collection and be reusable between tests?

const documentPath = (testId, path) => `${testId}/${path}`;

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

async function getTest(testId) {
  const test = await Test.findById(testId);
  if (!test) {
    throw new ApiError(404, 'TEST_NOT_FOUND', `Test not found with id ${testId}.`);
  }
  const path = test.document.path;

  const documentDownloadUrl = await s3Service.getDownloadUrl(documentPath(testId, path));

  return { ...test.toJSON(), documentDownloadUrl };

}

export default {
  createTest,
  getTest,
};
