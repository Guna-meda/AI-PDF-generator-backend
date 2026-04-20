const router = require('express').Router();
const {
  generateDeck,
  getJobStatus
} = require('../controllers/generate.controller');

router.post('/', generateDeck);
router.get('/:jobId', getJobStatus);

module.exports = router;