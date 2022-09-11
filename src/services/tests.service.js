
import { Test } from '../models/test.js';
import documentsService from './documents.service.js';

async function createTest(data) {
  let { documentId, documentName, documentType } = data;
  let uploadUrl;

  if (documentName) {
    const document = await documentsService.createDocument(documentName, documentType);
    documentId = document.id;
    uploadUrl = document.uploadUrl;
  }
  
  const test = await Test.create({ ...data, documentId });

  return { ...test, uploadUrl };
}

export default {
  createTest,
};
