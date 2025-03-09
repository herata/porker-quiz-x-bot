import { TwitterApi, ApiResponseError } from 'twitter-api-v2';
import logger from './utils/logger.js';
export default class TwitterPollBot {
    constructor(config) {
        // Validate required credentials
        const missingCredentials = Object.entries({
            'API Key': config.apiKey,
            'API Secret': config.apiSecret,
            'Access Token': config.accessToken,
            'Access Secret': config.accessSecret,
        }).filter(([_, value]) => !value).map(([key]) => key);
        if (missingCredentials.length > 0) {
            throw new Error(`Missing Twitter credentials: ${missingCredentials.join(', ')}
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
     * Verify Twitter credentials
     */
    async verifyCredentials() {
        try {
            // Get own user information using app credentials
            const { data } = await this.client.v2.me();
            logger.info('Twitter credentials verified successfully', { userId: data.id });
        }
        catch (error) {
            if (error instanceof ApiResponseError) {
                if (error.code === 401) {
                    throw new Error('Invalid Twitter credentials. Please check:\n' +
                        '1. API Key and Secret are correct\n' +
                        '2. Access Token and Secret are correct\n' +
                        '3. Tokens have not expired or been revoked');
                }
                if (error.code === 403) {
                    throw new Error('Account does not have required permissions. Please verify:\n' +
                        '1. OAuth 1.0a is enabled in Developer Portal\n' +
                        '2. App permissions are set to "Read and write"\n' +
                        '3. Access Tokens were generated after setting correct permissions\n' +
                        '4. Type of App is set to "Native App"\n' +
                        '5. Callback URL is set to http://127.0.0.1');
                }
            }
            throw error;
        }
    }
    /**
     * Create a poll tweet
     * @param pollData Poll configuration
     * @returns Created poll tweet data
     */
    async createPoll(pollData) {
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
            logger.info('Creating poll', {
                title: pollData.title,
                options: pollData.options,
                durationMinutes: duration
            });
            const tweet = await this.client.v2.tweet({
                text: pollData.title,
                poll: {
                    options: pollData.options,
                    duration_minutes: duration
                }
            });
            logger.info('Poll created successfully', { tweetId: tweet.data.id });
            return tweet.data;
        }
        catch (error) {
            if (error instanceof ApiResponseError) {
                logger.error('Twitter API error', {
                    code: error.code,
                    message: error.data?.detail || error.message,
                    rateLimitRemaining: error.rateLimit?.remaining,
                    resetAt: error.rateLimit?.reset
                });
                if (error.code === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
                if (error.code === 403) {
                    throw new Error('Unable to create poll. Please verify:\n' +
                        '1. OAuth 1.0a is enabled in Developer Portal\n' +
                        '2. App permissions are set to "Read and write"\n' +
                        '3. Access Tokens were generated after setting permissions\n' +
                        '4. Type of App is set to "Native App"\n' +
                        '5. Callback URL is set to http://127.0.0.1');
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
     * @param pollData Poll configuration
     * @param scheduledTime When to post the poll
     */
    async schedulePoll(pollData, scheduledTime) {
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
                    }
                    catch (error) {
                        logger.error('Error creating scheduled poll', {
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }, scheduledTime.getTime() - now.getTime())
            });
        }
        catch (error) {
            logger.error('Error scheduling poll', {
                error: error instanceof Error ? error.message : 'Unknown error',
                pollData,
                scheduledTime
            });
            throw error;
        }
    }
    /**
     * Cancel all scheduled polls
     */
    cancelScheduledPolls() {
        for (const poll of this.scheduledPolls) {
            clearTimeout(poll.timer);
        }
        this.scheduledPolls = [];
        logger.info('All scheduled polls cancelled');
    }
}
//# sourceMappingURL=TwitterPollBot.js.map