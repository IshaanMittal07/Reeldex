// Row shapes the app reads. `CardData` mirrors shared/schemas/card.ts, kept as a
// plain type so the app bundle doesn't pull in zod.

// Mirrors CATEGORIES in shared/schemas/card.ts, in the order the library shows them.
export const CATEGORIES = [
  'resume',
  'applying',
  'cold_dm',
  'opportunity',
  'student_benefit',
  'food',
  'fitness',
  'grooming',
  'money',
  'tech',
  'video_creation',
  'travel',
  'general',
] as const;

export type Category = (typeof CATEGORIES)[number];

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

export type KeyFrame = { timestamp: string; caption: string; why: string };

export type Visual = {
  kind: 'table' | 'flow';
  title: string;
  columns: string[];
  rows: string[][];
  steps: { label: string; detail: string | null }[];
};

// A frame cut from the video and stored in the `frames` bucket.
export type Frame = { path: string; timestamp: string; caption: string };

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
  // Optional: cards made before prompt v2 (frames, visual) or v3 (takeaways) don't have them.
  takeaways?: string[];
  key_frames?: KeyFrame[];
  visual?: Visual | null;
  resume: ResumeData | null;
  cold_dm: ColdDmData | null;
};

export type Card = {
  id: string;
  category: Category;
  title: string;
  summary: string | null;
  data: CardData;
  frames: Frame[];
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
  applying: 'Jobs & interviews',
  cold_dm: 'Networking',
  opportunity: 'Opportunities',
  student_benefit: 'Student perks',
  food: 'Food',
  fitness: 'Fitness',
  grooming: 'Style & grooming',
  money: 'Money',
  tech: 'Tech & AI',
  video_creation: 'Content creation',
  travel: 'Travel',
  general: 'General',
};

// Shown in place of a thumbnail until the reel's frames are captured.
export const CATEGORY_GLYPHS: Record<Category, string> = {
  resume: '📄',
  applying: '💼',
  cold_dm: '💬',
  opportunity: '✨',
  student_benefit: '🎓',
  food: '🍩',
  fitness: '🏋️',
  grooming: '🧴',
  money: '💸',
  tech: '💻',
  video_creation: '🎬',
  travel: '✈️',
  general: '📌',
};

// Cards made before prompt v4 can say meal_plan (now food); anything unknown is general.
const LEGACY_CATEGORIES: Record<string, Category> = { meal_plan: 'food' };

export function toCategory(value: string): Category {
  if ((CATEGORIES as readonly string[]).includes(value)) return value as Category;
  return LEGACY_CATEGORIES[value] ?? 'general';
}
