require('dotenv').config();
const { Worker } = require('bullmq');
const IORedis = require('ioredis');

const { generatePDFBlueprint } = require('../services/ai.service');
const { generatePDF } = require('../services/pdf.service');

const connection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null
});

const worker = new Worker(
  'deck-generation',
  async (job) => {
    try {
      const { prompt } = job.data;

      console.log('Job started:', job.id);

      await job.updateProgress(10);

      const blueprint = await generatePDFBlueprint(prompt);

      console.log('Blueprint created');

      await job.updateProgress(50);

      const fileUrl = await generatePDF(blueprint, job);

      console.log('PDF created');

      await job.updateProgress(100);

      return {
        success: true,
        fileUrl
      };

    } catch (error) {
      console.error('WORKER ERROR:', error);
      throw error;
    }
  },
  { 
    connection,
    lockDuration: 60000,      // Increase lock to 60 seconds (default 30s)
    stalledInterval: 30000    // Check for stalls every 30 seconds
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed`);
  console.error(err);
});