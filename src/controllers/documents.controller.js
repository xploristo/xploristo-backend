import documentsService from '../services/documents.service.js';

async function getDownloadUrl(req, res) {
  const downloadUrl = await documentsService.getDownloadUrl(req.params.id);

  res.status(200).json(downloadUrl);
}

export default {
  getDownloadUrl,
};
