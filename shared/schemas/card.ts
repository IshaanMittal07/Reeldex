import * as z from 'zod';

type JSONSchema = z.core.JSONSchema.JSONSchema;

// Card schema (plan Section 5.3). Written as JSON Schema because that is what
// Gemini structured output takes; the Zod validator is derived from it so the
// two can never drift apart. Sprint 0 covers the base + resume + cold_dm;
// v2 adds key_frames (cut from the video by ffmpeg) and an app-drawn visual.

export const CATEGORIES = [
  'resume',
  'applying',
  'cold_dm',
  'opportunity',
  'student_benefit',
  'fitness',
  'meal_plan',
  'grooming',
  'video_creation',
  'general',
] as const;

const str: JSONSchema = { type: 'string' };
const strOrNull: JSONSchema = { type: ['string', 'null'] };
const strList: JSONSchema = { type: 'array', items: str };

const keyPoint: JSONSchema = {
  type: 'object',
  properties: {
    text: str,
    timestamp: { type: 'string', description: 'mm:ss' },
    uncertain: { type: 'boolean' },
  },
  required: ['text', 'timestamp', 'uncertain'],
};

const resource: JSONSchema = {
  type: 'object',
  properties: {
    name: str,
    type: { type: 'string', enum: ['link', 'app', 'website', 'handle', 'product', 'code'] },
    url_if_shown: strOrNull,
    verified: { type: 'boolean', description: 'Always false; set later by the resource resolver.' },
    uncertain: { type: 'boolean' },
  },
  required: ['name', 'type', 'url_if_shown', 'verified', 'uncertain'],
};

const resume: JSONSchema = {
  type: ['object', 'null'],
  description: 'Fill only when category is resume, otherwise null.',
  properties: {
    do: strList,
    dont: strList,
    before_after_examples: {
      type: 'array',
      items: {
        type: 'object',
        properties: { before: str, after: str },
        required: ['before', 'after'],
      },
    },
    sections_mentioned: strList,
    tools: strList,
  },
  required: ['do', 'dont', 'before_after_examples', 'sections_mentioned', 'tools'],
};

const coldDm: JSONSchema = {
  type: ['object', 'null'],
  description: 'Fill only when category is cold_dm, otherwise null.',
  properties: {
    templates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Verbatim template text.' },
          platform: strOrNull,
          purpose: strOrNull,
        },
        required: ['text', 'platform', 'purpose'],
      },
    },
    follow_up_rules: strOrNull,
    personalization_slots: { ...strList, description: 'e.g. {name}, {company}' },
  },
  required: ['templates', 'follow_up_rules', 'personalization_slots'],
};

const keyFrame: JSONSchema = {
  type: 'object',
  properties: {
    timestamp: { type: 'string', description: 'mm:ss of the exact moment to capture, when the screen is clear and still.' },
    caption: { type: 'string', description: 'What the frame shows, in a few words.' },
    why: { type: 'string', description: 'Why seeing it helps more than reading it.' },
  },
  required: ['timestamp', 'caption', 'why'],
};

const visual: JSONSchema = {
  type: ['object', 'null'],
  description:
    'A table or step flow the app will draw so the advice is easier to use. Only values from the video. null if nothing fits.',
  properties: {
    kind: { type: 'string', enum: ['table', 'flow'] },
    title: str,
    columns: { ...strList, description: 'table: header cells. flow: empty.' },
    rows: { type: 'array', items: strList, description: 'table: one cell per column per row. flow: empty.' },
    steps: {
      type: 'array',
      description: 'flow: ordered steps. table: empty.',
      items: {
        type: 'object',
        properties: { label: str, detail: strOrNull },
        required: ['label', 'detail'],
      },
    },
  },
  required: ['kind', 'title', 'columns', 'rows', 'steps'],
};

export const cardJsonSchema: JSONSchema = {
  type: 'object',
  properties: {
    is_actionable: { type: 'boolean' },
    category: { type: 'string', enum: [...CATEGORIES] },
    secondary_categories: { type: 'array', items: { type: 'string', enum: [...CATEGORIES] }, maxItems: 2 },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    title: str,
    one_line_summary: str,
    key_points: { type: 'array', items: keyPoint },
    resources: { type: 'array', items: resource },
    creator_handle: strOrNull,
    action_items: strList,
    warnings: strList,
    key_frames: { type: 'array', items: keyFrame, maxItems: 4 },
    visual,
    resume,
    cold_dm: coldDm,
  },
  required: [
    'is_actionable',
    'category',
    'secondary_categories',
    'confidence',
    'title',
    'one_line_summary',
    'key_points',
    'resources',
    'creator_handle',
    'action_items',
    'warnings',
    'key_frames',
    'visual',
    'resume',
    'cold_dm',
  ],
};

export const cardSchema = z.fromJSONSchema(cardJsonSchema);
