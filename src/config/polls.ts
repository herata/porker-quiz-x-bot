import path from 'node:path';

/**
 * Poll configuration interface
 */
export interface PollConfig {
  title: string;
  options: string[];
  durationHours: number;
  imagePath?: string;
  hashtags?: string[];
}

/**
 * Poll configurations
 * Add your polls here
 */
export const polls: PollConfig[] = [
  {
    title: "What's your favorite programming language?",
    options: ['JavaScript', 'Python', 'Java', 'C++'],
    durationHours: 24,
    imagePath: path.join(process.cwd(), 'images', 'test.png'),
    hashtags: ['programming', 'coding', 'dev']
  },
  // Add more polls as needed
  {
    title: "Which framework do you prefer?",
    options: ['React', 'Vue', 'Angular', 'Svelte'],
    durationHours: 48,
    hashtags: ['webdev', 'frontend']
  }
];

/**
 * Get formatted title with hashtags
 */
export function getFormattedTitle(poll: PollConfig): string {
  const hashtags = poll.hashtags?.map(tag => `#${tag}`).join(' ') ?? '';
  return hashtags ? `${poll.title} ${hashtags}` : poll.title;
}

/**
 * Get the default poll (first one in the list)
 */
export function getDefaultPoll(): PollConfig {
  return {
    ...polls[0],
    title: getFormattedTitle(polls[0])
  };
}

/**
 * Get a specific poll by index
 */
export function getPollByIndex(index: number): PollConfig | undefined {
  const poll = polls[index];
  if (poll) {
    return {
      ...poll,
      title: getFormattedTitle(poll)
    };
  }
  return undefined;
}