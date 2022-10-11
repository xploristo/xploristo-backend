import resultsService from '../services/results.service.js';

async function getResults(req, res) {
  const results = await resultsService.getResults(req.jwtUser);

  if (!results || !results.length) {
    return res.status(204).json(results);
  }

  res.status(200).json(results);
}

async function createResult(req, res) {
  // TODO Validate body (Joi?)
  const result = await resultsService.createResult(req.body, req.jwtUser);

  res.status(201).json(result);
}

async function getResult(req, res) {
  const { resultId } = req.params;

  const result = await resultsService.getResult(resultId);

  res.status(200).json(result);
}
export default {
  getResults,
  createResult,
  getResult,
};
