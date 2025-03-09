import 'dotenv/config';
import TwitterPollBot from './TwitterPollBot.js';
import logger from './utils/logger.js';
import { getDefaultPoll, getPollByIndex } from './config/polls.js';

// Initialize the bot with credentials from environment variables
const bot = new TwitterPollBot({
  apiKey: process.env.TWITTER_API_KEY ?? '',
  apiSecret: process.env.TWITTER_API_SECRET ?? '',
  accessToken: process.env.TWITTER_ACCESS_TOKEN ?? '',
  accessSecret: process.env.TWITTER_ACCESS_SECRET ?? '',
  defaultDurationHours: Number.parseInt(process.env.POLL_DEFAULT_DURATION_HOURS ?? '24', 10)
});

// Function to create a poll with error handling and retries
async function createPollWithRetry(pollIndex?: number, retries = 3): Promise<void> {
  // Get poll configuration
  const pollConfig = pollIndex !== undefined ? getPollByIndex(pollIndex) : getDefaultPoll();
  if (!pollConfig) {
    throw new Error(`Poll configuration not found for index: ${pollIndex}`);
  }

  for (let i = 0; i < retries; i++) {
    try {
      await bot.createPoll(pollConfig);
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

// Parse poll index from command line arguments
const pollIndex = process.argv[2] ? Number(process.argv[2]) : undefined;

// Immediately create a poll when the program starts
(async () => {
  try {
    await createPollWithRetry(pollIndex);
    logger.info('Poll created successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to create poll', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    process.exit(1);
  }
})();

// Handle process termination signals
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM signal');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT signal');
  process.exit(0);
});