import * as z from 'zod';

type JSONSchema = z.core.JSONSchema.JSONSchema;

// Card schema (plan Section 5.3). Written as JSON Schema because that is what
// Gemini structured output takes; the Zod validator is derived from it so the
// two can never drift apart. Sprint 0 covers the base + resume + cold_dm.

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
    'resume',
    'cold_dm',
  ],
};

export const cardSchema = z.fromJSONSchema(cardJsonSchema);
