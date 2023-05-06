function getDocumentPath(testId, documentName) {
  return `${testId}/${new Date().getTime()}/${documentName}`;
}

export default {
  getDocumentPath,
};
