import ApiError from '../helpers/api-error.js';
import { Document } from '../models/document.js';
import s3Service from './s3.service.js';

async function getDownloadUrl(documentId) {
  const { name } = await Document.findById(documentId);
  return await s3Service.getDownloadUrl(name);
}

async function createDocument(name, type) {
  const doesDocumentExist = await Document.exists({ name });
  if (doesDocumentExist) {
    throw new ApiError(400, 'DUPLICATE_DOCUMENT_NAME', 'A document already exists with given name');
  }
  
  const document = await Document.create({ name, type });
  const uploadUrl = await s3Service.getUploadUrl(document.name, document.type);

  return uploadUrl;
}

export default {
  getDownloadUrl,
  createDocument
};
