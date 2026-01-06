import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { labSchema } from '@/db/schema';
import { getLabIdFromRequest } from './helpers';

export const getLabInfo = createServerFn({ method: 'GET' })
  .handler(async ({ request }) => {
    try {
      const labId = await getLabIdFromRequest(request);

      const [lab] = await db
        .select()
        .from(labSchema)
        .where(eq(labSchema.id, labId))
        .limit(1);

      if (!lab) {
        throw new Error('Lab not found');
      }

      return {
        success: true,
        data: lab,
      };
    } catch (error) {
      console.error('Error fetching lab info:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch lab information'
      );
    }
  });
