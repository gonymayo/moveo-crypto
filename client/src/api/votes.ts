import apiClient from './client';

export type VoteValue = 'up' | 'down';
export type Section = 'prices' | 'news' | 'ai_insight' | 'meme';

export const votesApi = {
  submit: async (data: {
    section: Section;
    contentId: string;
    vote: VoteValue;
  }): Promise<void> => {
    await apiClient.post('/votes', data);
  },
};
