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
}
export default class TwitterPollBot {
    private client;
    private defaultDurationHours;
    private scheduledPolls;
    constructor(config: TwitterConfig);
    /**
     * Verify Twitter credentials
     */
    verifyCredentials(): Promise<void>;
    /**
     * Create a poll tweet
     * @param pollData Poll configuration
     * @returns Created poll tweet data
     */
    createPoll(pollData: PollData): Promise<unknown>;
    /**
     * Schedule a poll to be created at a specific time
     * @param pollData Poll configuration
     * @param scheduledTime When to post the poll
     */
    schedulePoll(pollData: PollData, scheduledTime: Date): Promise<void>;
    /**
     * Cancel all scheduled polls
     */
    cancelScheduledPolls(): void;
}
export {};
