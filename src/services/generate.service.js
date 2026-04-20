const generationQueue = require('../queue/generation.queue');

const createGenerationJob = async (prompt) => {
  const job = await generationQueue.add(
    'generate-deck',
    { prompt },
    {
      attempts: 3,
      removeOnComplete: false,
      removeOnFail: false
    }
  );

  return job;
};

const fetchJobStatus = async (jobId) => {
  const job = await generationQueue.getJob(jobId);

  if (!job) {
    throw new Error('Job not found');
  }

  const state = await job.getState();

  return {
    id: job.id,
    state,
    progress: job.progress,
    result: job.returnvalue || null
  };
};

module.exports = {
  createGenerationJob,
  fetchJobStatus
};