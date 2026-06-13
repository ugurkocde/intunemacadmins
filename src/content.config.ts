import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        generated: z.boolean().optional(),
        // Docs-freshness metadata (optional, backward compatible):
        // lastReviewed - ISO date the page was last verified against upstream.
        // sources - authoritative MS/Apple URLs this page is based on, so the
        // freshness checker can diff the page against current ground truth.
        lastReviewed: z.string().optional(),
        sources: z.array(z.string().url()).optional(),
      }),
    }),
  }),
};
