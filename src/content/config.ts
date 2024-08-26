import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

const docs = defineCollection({
  schema: docsSchema({
    extend: z.object({
      showComments: z.boolean().optional(),
    }),
  }),
});

export const collections = { docs };