import 'dotenv/config';
import TwitterPollBot from './TwitterPollBot.js';
import logger from './utils/logger.js';

// Initialize the bot with credentials from environment variables
const bot = new TwitterPollBot({
  apiKey: process.env.TWITTER_API_KEY ?? '',
  apiSecret: process.env.TWITTER_API_SECRET ?? '',
  accessToken: process.env.TWITTER_ACCESS_TOKEN ?? '',
  accessSecret: process.env.TWITTER_ACCESS_SECRET ?? '',
  defaultDurationHours: Number.parseInt(process.env.POLL_DEFAULT_DURATION_HOURS ?? '24', 10)
});

// Example poll data
const examplePoll = {
  title: "What's your favorite programming language?",
  options: ['JavaScript', 'Python', 'Java', 'C++'],
  durationHours: 24
};

// Function to create a poll with error handling
async function createPollWithRetry(pollData: {
  title: string;
  options: string[];
  durationHours?: number;
}, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await bot.createPoll(pollData);
      return;
    } catch (error) {
      logger.error(`Poll creation attempt ${i + 1} failed`, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      if (i === retries - 1) {
        throw error;
      }
      // Wait for 1 minute before retrying
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }
}

// Immediately create a poll when the program starts
(async () => {
  try {
    await createPollWithRetry(examplePoll);
    logger.info('Poll created successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to create poll', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    process.exit(1);
  }
})();

// Handle process termination
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM signal');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT signal');
  process.exit(0);
});