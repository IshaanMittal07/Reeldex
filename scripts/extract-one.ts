// Sprint 0 proof: one downloaded reel -> card JSON (plan Section 14, step 4).
// Usage: npm run extract -- eval/videos/reel.mp4 ["optional caption text"]
import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'node:fs';

import { cardJsonSchema, cardSchema } from '../shared/schemas/card';

async function main() {
  const [videoPath, caption = ''] = process.argv.slice(2);
  if (!videoPath) throw new Error('Usage: npm run extract -- <video.mp4> ["caption"]');
  const model = process.env.GEMINI_MODEL;
  if (!process.env.GEMINI_API_KEY || !model) throw new Error('Set GEMINI_API_KEY and GEMINI_MODEL in .env');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = readFileSync('prompts/extract.v4.md', 'utf8').replace('{caption}', caption);

  let file = await ai.files.upload({ file: videoPath, config: { mimeType: 'video/mp4' } });
  try {
    while (file.state !== 'ACTIVE') {
      if (file.state === 'FAILED') throw new Error('Gemini could not process the video');
      await new Promise((r) => setTimeout(r, 3000));
      file = await ai.files.get({ name: file.name! });
    }

    const interaction = await ai.interactions.create({
      model,
      system_instruction: prompt,
      input: [{ type: 'video', uri: file.uri!, mime_type: 'video/mp4' }],
      response_format: { type: 'text', mime_type: 'application/json', schema: cardJsonSchema },
      store: false,
    });

    const card = cardSchema.parse(JSON.parse(interaction.output_text ?? ''));
    console.log(JSON.stringify(card, null, 2));
  } finally {
    // Never keep the video longer than needed (plan Section 4).
    await ai.files.delete({ name: file.name! });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
