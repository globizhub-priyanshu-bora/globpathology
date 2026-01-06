import { createServerFn } from '@tanstack/react-start';
import { and, count, desc, eq, ilike, isNull, ne, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { doctorSchema } from '@/db/schema';
import { toast } from '@/lib/toast';
import { getLabIdFromRequest } from './helpers';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const DoctorCreateSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  gender: z.string().optional(), // NEW: Gender field
  specialization: z.string().optional(),
  phoneNumber: z.number().int().positive().optional(),
  photoDocument: z.string().optional(), // NEW: Photo document (base64 or URL)
});

const DoctorUpdateSchema = z.object({
  id: z.number().int().positive(),
  registrationNumber: z.string().min(1).optional(),
  name: z.string().min(2).optional(),
  gender: z.string().optional(), // NEW: Gender field
  specialization: z.string().optional(),
  phoneNumber: z.number().int().positive().optional(),
  photoDocument: z.string().optional(), // NEW: Photo document
});

const DoctorIdSchema = z.object({
  id: z.number().int().positive(),
});

const DoctorSearchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const DoctorListSchema = z.object({
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'createdAt', 'specialization']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const registerDoctor = createServerFn({ method: 'POST' })
  .inputValidator(DoctorCreateSchema)
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      // Check if registration number already exists IN THIS LAB
      const existing = await db
        .select()
        .from(doctorSchema)
        .where(
          and(
            eq(doctorSchema.registrationNumber, data.registrationNumber),
            eq(doctorSchema.labId, labId),
            isNull(doctorSchema.deletedAt)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error('Doctor with this registration number already exists in your lab');
      }

      // Insert new doctor WITH labId
      const [newDoctor] = await db
        .insert(doctorSchema)
        .values({
          labId,
          registrationNumber: data.registrationNumber,
          name: data.name,
          gender: data.gender || null, // NEW: Store gender
          specialization: data.specialization || null,
          phoneNumber: data.phoneNumber || null,
          photoDocument: data.photoDocument || null, // NEW: Store photo document
        })
        .returning();

      return {
        success: true,
        message: 'Doctor registered successfully',
        data: newDoctor,
      };
    } catch (error) {
      console.error('Error registering doctor:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to register doctor'
      );
    }
  });

export const getAllDoctors = createServerFn({ method: 'GET' })
  .inputValidator(DoctorListSchema)
  .handler(async ({ data, request }) => {
    try {
      const { limit, offset, sortBy, sortOrder } = data;

      // CRITICAL: Get labId from authenticated user
      let labId: number;
      try {
        labId = await getLabIdFromRequest(request);
      } catch (error) {
        console.error('Error getting lab ID:', error);
        // Return empty list instead of throwing to prevent deployment errors
        return {
          success: false,
          data: [],
          total: 0,
          limit,
          offset,
        };
      }

      // Build the sorting condition
      let sortColumn: any = desc(doctorSchema.createdAt);
      if (sortBy === 'name') {
        sortColumn = sortOrder === 'asc' ? doctorSchema.name : desc(doctorSchema.name);
      } else if (sortBy === 'specialization') {
        sortColumn = sortOrder === 'asc' ? doctorSchema.specialization : desc(doctorSchema.specialization);
      } else {
        sortColumn = sortOrder === 'asc' ? doctorSchema.createdAt : desc(doctorSchema.createdAt);
      }

      // Query doctors for THIS LAB ONLY
      const doctors = await db
        .select()
        .from(doctorSchema)
        .where(
          and(
            eq(doctorSchema.labId, labId),
            isNull(doctorSchema.deletedAt)
          )
        )
        .orderBy(sortColumn)
        .limit(limit)
        .offset(offset);

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(doctorSchema)
        .where(
          and(
            eq(doctorSchema.labId, labId),
            isNull(doctorSchema.deletedAt)
          )
        );

      const total = totalResult[0]?.count || 0;

      return {
        success: true,
        data: doctors,
        total: total,
        limit: limit,
        offset: offset,
      };
    } catch (error) {
      console.error('Error fetching doctors:', error);
      // Return empty list instead of throwing to prevent deployment errors
      return {
        success: false,
        data: [],
        total: 0,
        limit: data.limit,
        offset: data.offset,
      };
    }
  });

export const getDoctorById = createServerFn({ method: 'GET' })
  .inputValidator(DoctorIdSchema)
  .handler(async ({ data, request }) => {
    try {
      const labId = await getLabIdFromRequest(request);

      const [doctor] = await db
        .select()
        .from(doctorSchema)
        .where(
          and(
            eq(doctorSchema.id, data.id),
            eq(doctorSchema.labId, labId),
            isNull(doctorSchema.deletedAt)
          )
        );

      if (!doctor) {
        throw new Error('Doctor not found');
      }

      return {
        success: true,
        data: doctor,
      };
    } catch (error) {
      console.error('Error fetching doctor:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch doctor'
      );
    }
  });

export const updateDoctor = createServerFn({ method: 'PUT' })
  .inputValidator(DoctorUpdateSchema)
  .handler(async ({ data, request }) => {
    try {
      const labId = await getLabIdFromRequest(request);
      const { id, ...updateData } = data;

      // Verify doctor exists and belongs to this lab
      const [existingDoctor] = await db
        .select()
        .from(doctorSchema)
        .where(
          and(
            eq(doctorSchema.id, id),
            eq(doctorSchema.labId, labId),
            isNull(doctorSchema.deletedAt)
          )
        );

      if (!existingDoctor) {
        throw new Error('Doctor not found');
      }

      // Check for duplicate registration number if it's being changed
      if (updateData.registrationNumber && updateData.registrationNumber !== existingDoctor.registrationNumber) {
        const duplicate = await db
          .select()
          .from(doctorSchema)
          .where(
            and(
              eq(doctorSchema.registrationNumber, updateData.registrationNumber),
              eq(doctorSchema.labId, labId),
              isNull(doctorSchema.deletedAt)
            )
          )
          .limit(1);

        if (duplicate.length > 0) {
          throw new Error('Another doctor with this registration number already exists');
        }
      }

      const [updatedDoctor] = await db
        .update(doctorSchema)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(doctorSchema.id, id))
        .returning();

      return {
        success: true,
        message: 'Doctor updated successfully',
        data: updatedDoctor,
      };
    } catch (error) {
      console.error('Error updating doctor:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update doctor'
      );
    }
  });

export const deleteDoctor = createServerFn({ method: 'DELETE' })
  .inputValidator(DoctorIdSchema)
  .handler(async ({ data, request }) => {
    try {
      const labId = await getLabIdFromRequest(request);

      // Soft delete - set deletedAt
      const [deletedDoctor] = await db
        .update(doctorSchema)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(doctorSchema.id, data.id),
            eq(doctorSchema.labId, labId)
          )
        )
        .returning();

      if (!deletedDoctor) {
        throw new Error('Doctor not found');
      }

      return {
        success: true,
        message: 'Doctor deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting doctor:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete doctor'
      );
    }
  });

export const searchDoctors = createServerFn({ method: 'GET' })
  .inputValidator(DoctorSearchSchema)
  .handler(async ({ data, request }) => {
    try {
      const labId = await getLabIdFromRequest(request);
      const { query, limit, offset } = data;

      const doctors = await db
        .select()
        .from(doctorSchema)
        .where(
          and(
            eq(doctorSchema.labId, labId),
            isNull(doctorSchema.deletedAt),
            or(
              ilike(doctorSchema.name, `%${query}%`),
              ilike(doctorSchema.specialization, `%${query}%`)
            )
          )
        )
        .limit(limit)
        .offset(offset);

      return {
        success: true,
        data: doctors,
      };
    } catch (error) {
      console.error('Error searching doctors:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to search doctors'
      );
    }
  });
