const {
  createGenerationJob,
  fetchJobStatus
} = require('../services/generate.service');

const generateDeck = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    const job = await createGenerationJob(prompt);

    res.status(202).json({
      success: true,
      message: 'Generation started',
      jobId: job.id
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    const data = await fetchJobStatus(jobId);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  generateDeck,
  getJobStatus
};