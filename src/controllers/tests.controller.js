import testsService from '../services/tests.service.js';

async function createTest(req, res) {
  const test = await testsService.createTest(req.body);

  res.status(200).json(test);
}

export default {
  createTest,
};
