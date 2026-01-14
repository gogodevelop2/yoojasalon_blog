import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    summary: z.string().optional(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    thumbnail: z.string().optional(),
    status: z.enum(["draft", "published"]),
    originalId: z.number().optional(),
  }),
});

export const collections = { posts };
