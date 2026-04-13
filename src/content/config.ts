import { defineCollection, z } from 'astro:content';

const writings = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

const shop = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    price: z.string(),
    type: z.enum(['digital', 'physical']),
    image: z.string().optional(),
    stripeLink: z.string(),
    soldOut: z.boolean().default(false),
    draft: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

export const collections = { writings, shop };
