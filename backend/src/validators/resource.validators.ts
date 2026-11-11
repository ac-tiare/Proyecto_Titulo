import { z } from 'zod';

export const resourceCategorySchema = z.enum([
  'bienestar-emocional',
  'senales-alerta',
  'autocuidado',
  'busqueda-ayuda-prevencion',
]);

export const listResourcesSchema = z
  .object({ category: resourceCategorySchema.optional() })
  .strict();

export const resourceIdParamsSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,100}$/),
});

export type ResourceCategoryId = z.infer<typeof resourceCategorySchema>;
