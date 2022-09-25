import testsService from '../services/tests.service.js';

async function createTest(req, res) {
  // TODO Validate body (Joi?)
  const test = await testsService.createTest(req.body);

  res.status(201).json(test);
}

async function getTest(req, res) {
  const { testId } = req.params;

  const test = await testsService.getTest(testId);

  res.status(200).json(test);
}

export default {
  createTest,
  getTest,
};
