# Twitter Poll Bot

A TypeScript bot that creates and posts polls on Twitter/X using the Twitter API v2.

## Features

- Immediate poll creation on execution
- Customizable poll options (up to 4 choices)
- Configurable poll duration
- Error handling with automatic retries
- Comprehensive logging
- Full TypeScript support with type definitions

## Prerequisites

- Node.js 14 or higher
- Twitter Developer Account with API v2 access
- Twitter API credentials (API key, API secret, Access token, Access token secret)

## Twitter API Setup

To avoid 403 errors, make sure your Twitter Developer App is properly configured:

1. Go to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Select your app
3. Go to "Settings" > "User authentication settings"
4. Enable OAuth 1.0a
5. Set App permissions to "Read and write"
6. Generate or regenerate your access tokens
   - Make sure to generate access tokens with the same permissions as your app
   - If you changed permissions, you need new tokens

Without these settings, you'll get a 403 error when trying to create polls.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/twitter-poll-bot.git
cd twitter-poll-bot
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables template:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
POLL_DEFAULT_DURATION_HOURS=24
LOG_LEVEL=info
```

## Building and Running

Build the TypeScript code:
```bash
npm run build
```

Run the bot to post a poll immediately:
```bash
npm start
```

## Error Handling

The bot includes comprehensive error handling for common issues:

### 403 Forbidden Error
If you get a 403 error, check:
- App permissions are set to "Read and write"
- OAuth 1.0a is enabled
- Access tokens were generated after setting the correct permissions
- Access tokens have the same permission level as the app

### 401 Unauthorized Error
If you get a 401 error:
- Verify your API keys and tokens are correct
- Make sure tokens haven't expired
- Check if tokens were revoked

### 429 Rate Limit Error
If you get a 429 error:
- Wait before trying again
- The bot includes automatic retry logic with backoff

## Project Structure

```
.
├── src/
│   ├── index.ts           # Main entry point
│   ├── TwitterPollBot.ts  # Bot implementation
│   └── utils/
│       └── logger.ts      # Logging configuration
├── dist/                  # Compiled JavaScript output
├── logs/                  # Log files
├── .env.example          # Environment variables template
├── .env                  # Local environment variables (git-ignored)
├── tsconfig.json        # TypeScript configuration
└── README.md            # Project documentation
```

## Type Definitions

The project includes TypeScript interfaces for all major components:

```typescript
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
```

## Security Best Practices

1. **Environment Variables**
   - Never commit the `.env` file
   - Use environment variables for all sensitive data
   - Rotate API credentials regularly

2. **Error Handling**
   - All API calls are wrapped in try-catch blocks with proper typing
   - Failed operations are logged for debugging
   - Automatic retries for transient failures

3. **Rate Limiting**
   - The bot respects Twitter API rate limits
   - Implements exponential backoff for retries

4. **Logging**
   - Sensitive data is never logged
   - Logs are rotated to prevent disk space issues
   - Different log levels for different environments

## Troubleshooting

If you encounter issues:

1. Check the logs in the `logs/` directory
2. Verify Twitter API permissions in the Developer Portal
3. Ensure your tokens have the correct permissions
4. Look for rate limiting information in error messages

## License

ISC

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request