import testsService from '../services/tests.service.js';

async function createTest(req, res) {
  // TODO Validate body (Joi?)
  const test = await testsService.createTest(req.body);

  res.status(201).json(test);
}

async function updateTest(req, res) {
  // TODO Validate body (Joi?)
  const { testId } = req.params;

  const test = await testsService.updateTest(testId, req.body);

  res.status(201).json(test);
}

async function updateTestDocument(req, res) {
  // TODO Validate body (Joi?)
  const { testId } = req.params;

  const test = await testsService.updateTestDocument(testId, req.body);

  res.status(201).json(test);
}

async function getTest(req, res) {
  const { testId } = req.params;

  const test = await testsService.getTest(testId);

  res.status(200).json(test);
}

async function deleteTest(req, res) {
  const { testId } = req.params;

  await testsService.deleteTest(testId);

  res.sendStatus(200);
}

export default {
  createTest,
  updateTest,
  updateTestDocument,
  getTest,
  deleteTest,
};
