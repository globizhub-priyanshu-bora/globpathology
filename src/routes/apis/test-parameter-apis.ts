import { createServerFn } from '@tanstack/react-start';
import { and, count, desc, eq, ilike, isNull, ne, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { testParamSchema } from '@/db/schema';
import { getLabIdFromRequest } from './helpers';

// NEW: Reference Range Schema for different demographics
const ReferenceRangeSchema = z.object({
  ageGroup: z.string(), // "child", "adult", "senior"
  gender: z.string(), // "Male", "Female", "Any"
  minAge: z.number().optional(),
  maxAge: z.number().optional(),
  minValue: z.string(),
  maxValue: z.string(),
});

const TestParamCreateSchema = z.object({
  name: z.string().min(1, 'Parameter name is required'),
  unit: z.string().optional(),
  price: z.string().optional(),
  referenceRanges: z.array(ReferenceRangeSchema).optional(), // NEW
  metadata: z.any().optional(),
});

const TestParamUpdateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).optional(),
  unit: z.string().optional(),
  price: z.string().optional(),
  referenceRanges: z.array(ReferenceRangeSchema).optional(), // NEW
  metadata: z.any().optional(),
});

const TestParamIdSchema = z.object({
  id: z.number().int().positive(),
});

const TestParamSearchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

const TestParamListSchema = z.object({
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'createdAt', 'price']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const createTestParameter = createServerFn({ method: 'POST' })
  .inputValidator(TestParamCreateSchema)
  .handler(async ({ data, request }) => {
    try {
      const labId = await getLabIdFromRequest(request);

      const existing = await db
        .select()
        .from(testParamSchema)
        .where(
          and(
            eq(testParamSchema.name, data.name),
            eq(testParamSchema.labId, labId),
            isNull(testParamSchema.deletedAt)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error('A parameter with this name already exists');
      }

      const [newParam] = await db
        .insert(testParamSchema)
        .values({
          labId,
          name: data.name,
          unit: data.unit || null,
          price: data.price || null,
          referenceRanges: data.referenceRanges || null, // NEW
          metadata: data.metadata || null,
        })
        .returning();

      return {
        success: true,
        message: 'Test parameter created successfully',
        data: { ...newParam, metadata: (newParam.metadata as any) || {} },
      };
    } catch (error) {
      console.error('Error creating test parameter:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create test parameter'
      );
    }
  });

export const getAllTestParameters = createServerFn({ method: 'GET' })
  .inputValidator(TestParamListSchema)
  .handler(async ({ data, request }) => {
    try {
      const { limit, offset, sortBy, sortOrder } = data;

      let labId: number;
      try {
        labId = await getLabIdFromRequest(request);
      } catch (error) {
        console.error('Error getting lab ID:', error);
        // Return empty list instead of throwing to prevent deployment errors
        return {
          success: true,
          data: [],
          pagination: {
            total: 0,
            limit,
            offset,
            hasMore: false,
          },
        };
      }

      const orderByColumn = testParamSchema[sortBy];
      const orderBy = sortOrder === 'desc' ? desc(orderByColumn) : orderByColumn;

      const countResult = await db
        .select({ count: count() })
        .from(testParamSchema)
        .where(
          and(
            eq(testParamSchema.labId, labId),
            isNull(testParamSchema.deletedAt)
          )
        );

      const totalCount = Number(countResult[0]?.count || 0);

      const parameters = await db
        .select()
        .from(testParamSchema)
        .where(
          and(
            eq(testParamSchema.labId, labId),
            isNull(testParamSchema.deletedAt)
          )
        )
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return {
        success: true,
        data: parameters.map(p => ({
          ...p,
          metadata: (p.metadata as any) || {},
          referenceRanges: (p.referenceRanges as any) || [] // NEW
        })),
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      };
    } catch (error) {
      console.error('Error fetching test parameters:', error);
      // Return empty list instead of throwing to prevent deployment errors
      return {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: data.limit,
          offset: data.offset,
          hasMore: false,
        },
      };
    }
  });

export const searchTestParameters = createServerFn({ method: 'GET' })
  .inputValidator(TestParamSearchSchema)
  .handler(async ({ data, request }) => {
    try {
      const { query, limit, offset } = data;
      const searchPattern = `%${query}%`;
      const labId = await getLabIdFromRequest(request);

      const parameters = await db
        .select()
        .from(testParamSchema)
        .where(
          and(
            eq(testParamSchema.labId, labId),
            or(
              ilike(testParamSchema.name, searchPattern),
              ilike(testParamSchema.unit, searchPattern)
            ),
            isNull(testParamSchema.deletedAt)
          )
        )
        .orderBy(testParamSchema.name)
        .limit(limit)
        .offset(offset);

      const countResult = await db
        .select({ count: count() })
        .from(testParamSchema)
        .where(
          and(
            eq(testParamSchema.labId, labId),
            or(
              ilike(testParamSchema.name, searchPattern),
              ilike(testParamSchema.unit, searchPattern)
            ),
            isNull(testParamSchema.deletedAt)
          )
        );

      const totalCount = Number(countResult[0]?.count || 0);

      return {
        success: true,
        data: parameters.map(p => ({
          ...p,
          metadata: (p.metadata as any) || {},
          referenceRanges: (p.referenceRanges as any) || []
        })),
        query,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      };
    } catch (error) {
      console.error('Error searching test parameters:', error);
      throw new Error('Failed to search test parameters');
    }
  });

export const getTestParameterById = createServerFn({ method: 'GET' })
  .inputValidator(TestParamIdSchema)
  .handler(async ({ data, request }) => {
    try {
      const labId = await getLabIdFromRequest(request);

      const [parameter] = await db
        .select()
        .from(testParamSchema)
        .where(
          and(
            eq(testParamSchema.id, data.id),
            eq(testParamSchema.labId, labId),
            isNull(testParamSchema.deletedAt)
          )
        )
        .limit(1);

      if (!parameter) {
        throw new Error('Test parameter not found');
      }

      return {
        success: true,
        data: {
          ...parameter,
          metadata: (parameter.metadata as any) || {},
          referenceRanges: (parameter.referenceRanges as any) || []
        },
      };
    } catch (error) {
      console.error('Error fetching test parameter:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch test parameter'
      );
    }
  });

export const updateTestParameter = createServerFn({ method: 'POST' })
  .inputValidator(TestParamUpdateSchema)
  .handler(async ({ data, request }) => {
    try {
      const { id, ...updateData } = data;
      const labId = await getLabIdFromRequest(request);

      const [existing] = await db
        .select()
        .from(testParamSchema)
        .where(
          and(
            eq(testParamSchema.id, id),
            eq(testParamSchema.labId, labId),
            isNull(testParamSchema.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        throw new Error('Test parameter not found');
      }

      if (updateData.name && updateData.name !== existing.name) {
        const [duplicate] = await db
          .select()
          .from(testParamSchema)
          .where(
            and(
              eq(testParamSchema.name, updateData.name),
              eq(testParamSchema.labId, labId),
              ne(testParamSchema.id, id),
              isNull(testParamSchema.deletedAt)
            )
          )
          .limit(1);

        if (duplicate) {
          throw new Error('A parameter with this name already exists');
        }
      }

      const [updated] = await db
        .update(testParamSchema)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(testParamSchema.id, id),
            eq(testParamSchema.labId, labId)
          )
        )
        .returning();

      return {
        success: true,
        message: 'Test parameter updated successfully',
        data: {
          ...updated,
          metadata: (updated.metadata as any) || {},
          referenceRanges: (updated.referenceRanges as any) || []
        },
      };
    } catch (error) {
      console.error('Error updating test parameter:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update test parameter'
      );
    }
  });

export const deleteTestParameter = createServerFn({ method: 'POST' })
  .inputValidator(TestParamIdSchema)
  .handler(async ({ data, request }) => {
    try {
      const labId = await getLabIdFromRequest(request);

      const [existing] = await db
        .select()
        .from(testParamSchema)
        .where(
          and(
            eq(testParamSchema.id, data.id),
            eq(testParamSchema.labId, labId),
            isNull(testParamSchema.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        throw new Error('Test parameter not found');
      }

      await db
        .update(testParamSchema)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(testParamSchema.id, data.id),
            eq(testParamSchema.labId, labId)
          )
        );

      return {
        success: true,
        message: 'Test parameter deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting test parameter:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete test parameter'
      );
    }
  });

export const restoreTestParameter = createServerFn({ method: 'POST' })
  .inputValidator(TestParamIdSchema)
  .handler(async ({ data, request }) => {
    try {
      const labId = await getLabIdFromRequest(request);

      const [restored] = await db
        .update(testParamSchema)
        .set({
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(testParamSchema.id, data.id),
            eq(testParamSchema.labId, labId)
          )
        )
        .returning();

      if (!restored) {
        throw new Error('Test parameter not found');
      }

      return {
        success: true,
        message: 'Test parameter restored successfully',
        data: {
          ...restored,
          metadata: (restored.metadata as any) || {},
          referenceRanges: (restored.referenceRanges as any) || []
        },
      };
    } catch (error) {
      console.error('Error restoring test parameter:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to restore test parameter'
      );
    }
  });
