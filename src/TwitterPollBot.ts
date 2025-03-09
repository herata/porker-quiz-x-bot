import { TwitterApi } from 'twitter-api-v2';
import type { ApiResponseError, SendTweetV2Params } from 'twitter-api-v2';
import logger from './utils/logger.js';
import fs from 'node:fs/promises';
import path from 'node:path';

interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
  defaultDurationHours?: number;
}

interface PollData {
  title: string;
  options: string[];
  durationHours?: number;
  imagePath?: string; // Optional path to the image file to attach
}

interface ScheduledPoll {
  pollData: PollData;
  scheduledTime: Date;
  timer: NodeJS.Timeout;
}

export default class TwitterPollBot {
  private client: TwitterApi;
  private defaultDurationHours: number;
  private scheduledPolls: ScheduledPoll[];

  constructor(config: TwitterConfig) {
    // Validate required credentials
    const missingCredentials = Object.entries({
      'API Key': config.apiKey,
      'API Secret': config.apiSecret,
      'Access Token': config.accessToken,
      'Access Secret': config.accessSecret,
    }).filter(([_, value]) => !value).map(([key]) => key);

    if (missingCredentials.length > 0) {
      throw new Error(`Missing X API credentials: ${missingCredentials.join(', ')}
Please ensure you have:
1. Enabled OAuth 1.0a in Developer Portal
2. Set App permissions to "Read and write"
3. Generated Access Tokens with appropriate permissions
4. Added all credentials to your .env file`);
    }

    // Create client with read and write permissions
    this.client = new TwitterApi({
      appKey: config.apiKey,
      appSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessSecret,
    });
    
    this.defaultDurationHours = config.defaultDurationHours || 24;
    this.scheduledPolls = [];
  }

  /**
   * Get MIME type from file extension
   * @param filePath Path to the image file
   * @returns The MIME type for the given file extension
   * @throws Error if the file extension is not supported
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    const mimeType = mimeTypes[ext];
    if (!mimeType) {
      throw new Error(`Unsupported image format: ${ext}. Supported formats are: PNG, JPEG, GIF, WebP`);
    }
    
    return mimeType;
  }

  /**
   * Verify X API credentials by attempting to fetch user information
   * @throws Error if credentials are invalid or permissions are insufficient
   */
  async verifyCredentials(): Promise<void> {
    try {
      // Get own user information using app credentials
      const { data } = await this.client.v2.me();
      logger.info('X API credentials verified successfully', { userId: data.id });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const apiError = error as ApiResponseError;
        if (apiError.code === 401) {
          throw new Error(
            'Invalid X API credentials. Please check:\n' +
            '1. API Key and Secret are correct\n' +
            '2. Access Token and Secret are correct\n' +
            '3. Tokens have not expired or been revoked'
          );
        }
        if (apiError.code === 403) {
          throw new Error(
            'Account does not have required permissions. Please verify:\n' +
            '1. OAuth 1.0a is enabled in Developer Portal\n' +
            '2. App permissions are set to "Read and write"\n' +
            '3. Access Tokens were generated after setting correct permissions\n' +
            '4. Type of App is set to "Native App"\n' +
            '5. Callback URL is set to http://127.0.0.1'
          );
        }
      }
      throw error;
    }
  }

  /**
   * Upload an image to X's media server
   * @param imagePath Path to the image file to upload
   * @returns The media ID assigned by X
   * @throws Error if the upload fails or the file format is not supported
   */
  private async uploadImage(imagePath: string): Promise<string> {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const mimeType = this.getMimeType(imagePath);
      
      logger.info('Uploading image', { 
        imagePath,
        mimeType,
        size: imageBuffer.length 
      });

      const mediaId = await this.client.v1.uploadMedia(imageBuffer, {
        mimeType: mimeType
      });

      logger.info('Image uploaded successfully', { mediaId });
      return mediaId;
    } catch (error) {
      logger.error('Error uploading image', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        imagePath 
      });
      throw error;
    }
  }

  /**
   * Create a poll post. If an image is provided, it will be posted as a separate tweet in a thread.
   * @param pollData The poll configuration including title, options, duration, and optional image
   * @returns The created poll data from X API
   * @throws Error if poll creation fails or requirements are not met
   */
  async createPoll(pollData: PollData): Promise<unknown> {
    try {
      // Verify credentials before attempting to create poll
      await this.verifyCredentials();

      if (!pollData.title || !pollData.options || pollData.options.length === 0) {
        throw new Error('Poll title and options are required');
      }

      if (pollData.options.length > 4) {
        throw new Error('Maximum 4 options are allowed for a poll');
      }

      const duration = (pollData.durationHours || this.defaultDurationHours) * 60; // Convert hours to minutes
      
      // If image is provided, post it first
      let reply_to: string | undefined;
      if (pollData.imagePath) {
        const mediaId = await this.uploadImage(pollData.imagePath);
        const imagePost = await this.client.v2.tweet({
          text: pollData.title,
          media: { media_ids: [mediaId] }
        });
        reply_to = imagePost.data.id;
        logger.info('Image post created successfully', { tweetId: reply_to });
      }

      // Create poll as a reply if there was an image, or as a standalone tweet if not
      const tweetParams: SendTweetV2Params = {
        text: reply_to ? '投票をお願いします！' : pollData.title,
        poll: {
          options: pollData.options,
          duration_minutes: duration
        }
      };

      if (reply_to) {
        tweetParams.reply = { in_reply_to_tweet_id: reply_to };
      }

      const tweet = await this.client.v2.tweet(tweetParams);
      logger.info('Poll created successfully', { tweetId: tweet.data.id });
      return tweet.data;

    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const apiError = error as ApiResponseError;
        logger.error('X API error', {
          code: apiError.code,
          message: apiError.data?.detail || apiError.message,
          rateLimitRemaining: apiError.rateLimit?.remaining,
          resetAt: apiError.rateLimit?.reset
        });
        
        if (apiError.code === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (apiError.code === 403) {
          throw new Error(
            'Unable to create poll. Please verify:\n' +
            '1. OAuth 1.0a is enabled in Developer Portal\n' +
            '2. App permissions are set to "Read and write"\n' +
            '3. Access Tokens were generated after setting permissions\n' +
            '4. Type of App is set to "Native App"\n' +
            '5. Callback URL is set to http://127.0.0.1'
          );
        }
      }

      logger.error('Error creating poll', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        title: pollData.title,
        options: pollData.options
      });
      throw error;
    }
  }

  /**
   * Schedule a poll to be created at a specific time
   * @param pollData The poll configuration to schedule
   * @param scheduledTime When to post the poll
   * @throws Error if scheduling fails or the scheduled time is invalid
   */
  async schedulePoll(pollData: PollData, scheduledTime: Date): Promise<void> {
    try {
      // Verify credentials before scheduling
      await this.verifyCredentials();

      if (!(scheduledTime instanceof Date)) {
        throw new Error('scheduledTime must be a valid Date object');
      }

      const now = new Date();
      if (scheduledTime <= now) {
        throw new Error('scheduledTime must be in the future');
      }

      logger.info('Scheduling poll', { 
        pollData,
        scheduledTime: scheduledTime.toISOString()
      });

      this.scheduledPolls.push({
        pollData,
        scheduledTime,
        timer: setTimeout(async () => {
          try {
            await this.createPoll(pollData);
          } catch (error) {
            logger.error('Error creating scheduled poll', { 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }, scheduledTime.getTime() - now.getTime())
      });

    } catch (error) {
      logger.error('Error scheduling poll', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        pollData,
        scheduledTime 
      });
      throw error;
    }
  }

  /**
   * Cancel all scheduled polls and clear the schedule
   */
  cancelScheduledPolls(): void {
    for (const poll of this.scheduledPolls) {
      clearTimeout(poll.timer);
    }
    this.scheduledPolls = [];
    logger.info('All scheduled polls cancelled');
  }
}