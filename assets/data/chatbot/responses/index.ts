import emotionalSupport from './emotional_support.json';
import generalFaq from './general_faq.json';
import prophetStories from './prophet_stories.json';
import sinsAndRepentance from './sins_and_repentance.json';
import surahInfo from './surah_info.json';
import appFeaturesFaq from './app_features_faq.json';
import type { EmotionalResponse } from '../../../../types';

// Combine all response arrays into one
export const allResponses: EmotionalResponse[] = [
  ...appFeaturesFaq.emotionalTriggers,
  ...emotionalSupport.emotionalTriggers,
  ...generalFaq.emotionalTriggers,
  ...prophetStories.emotionalTriggers,
  ...sinsAndRepentance.emotionalTriggers,
  ...surahInfo.emotionalTriggers
];

// Export suggested prompts from one of the files (assuming they are the same or we pick one as the source)
export const suggestedPrompts = emotionalSupport.suggestedPrompts;
