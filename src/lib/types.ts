// Row shapes the app reads. `CardData` mirrors shared/schemas/card.ts, kept as a
// plain type so the app bundle doesn't pull in zod.

export type Category =
  | 'resume'
  | 'applying'
  | 'cold_dm'
  | 'opportunity'
  | 'student_benefit'
  | 'fitness'
  | 'meal_plan'
  | 'grooming'
  | 'video_creation'
  | 'general';

export type KeyPoint = { text: string; timestamp: string; uncertain: boolean };

export type Resource = {
  name: string;
  type: 'link' | 'app' | 'website' | 'handle' | 'product' | 'code';
  url_if_shown: string | null;
  verified: boolean;
  uncertain: boolean;
};

export type ResumeData = {
  do: string[];
  dont: string[];
  before_after_examples: { before: string; after: string }[];
  sections_mentioned: string[];
  tools: string[];
};

export type ColdDmData = {
  templates: { text: string; platform: string | null; purpose: string | null }[];
  follow_up_rules: string | null;
  personalization_slots: string[];
};

export type CardData = {
  is_actionable: boolean;
  category: Category;
  secondary_categories: Category[];
  confidence: number;
  title: string;
  one_line_summary: string;
  key_points: KeyPoint[];
  resources: Resource[];
  creator_handle: string | null;
  action_items: string[];
  warnings: string[];
  resume: ResumeData | null;
  cold_dm: ColdDmData | null;
};

export type Card = {
  id: string;
  category: Category;
  title: string;
  summary: string | null;
  data: CardData;
  source_url: string | null;
  creator_handle: string | null;
  pinned: boolean;
  created_at: string;
};

export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

export type Job = {
  id: string;
  status: JobStatus;
  error: string | null;
  attempts: number;
  created_at: string;
};

export const CATEGORY_LABELS: Record<Category, string> = {
  resume: 'Resume',
  applying: 'Applying',
  cold_dm: 'Cold DMs',
  opportunity: 'Opportunities',
  student_benefit: 'Student perks',
  fitness: 'Fitness',
  meal_plan: 'Food',
  grooming: 'Grooming',
  video_creation: 'Video creation',
  general: 'General',
};
