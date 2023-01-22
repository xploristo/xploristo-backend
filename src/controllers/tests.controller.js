import testsService from '../services/tests.service.js';
import ApiError from '../helpers/api-error.js';

function checkUserRole(jwtUser) {
  if (!jwtUser.role === 'student') {
    throw new ApiError(403, 'FORBIDDEN', `You are not allowed to perform this action.`);
  }
}

async function getTests(req, res) {
  checkUserRole(req.jwtUser);

  const tests = await testsService.getTests();

  if (!tests || !tests.length) {
    return res.status(204).json(tests);
  }

  res.status(200).json(tests);
}

async function createTest(req, res) {
  checkUserRole(req.jwtUser);

  // TODO Validate body (Joi?)
  const test = await testsService.createTest(req.body);

  res.status(201).json(test);
}

async function updateTest(req, res) {
  checkUserRole(req.jwtUser);

  // TODO Validate body (Joi?)
  const { testId } = req.params;

  const test = await testsService.updateTest(testId, req.body);

  res.status(200).json(test);
}

async function updateTestDocument(req, res) {
  checkUserRole(req.jwtUser);

  // TODO Validate body (Joi?)
  const { testId } = req.params;

  const test = await testsService.updateTestDocument(testId, req.body);

  res.status(200).json(test);
}

async function getTest(req, res) {
  checkUserRole(req.jwtUser);

  const { testId } = req.params;

  const test = await testsService.getTest(testId, req.jwtUser);

  res.status(200).json(test);
}

async function deleteTest(req, res) {
  checkUserRole(req.jwtUser);

  const { testId } = req.params;

  await testsService.deleteTest(testId);

  res.sendStatus(200);
}

export default {
  getTests,
  createTest,
  updateTest,
  updateTestDocument,
  getTest,
  deleteTest,
};
