import { createServerFn } from '@tanstack/react-start';
import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import {
  billSchema,
  doctorSchema,
  labSchema,
  patientSchema,
  patientTestsSchema,
  testSchema,
} from '@/db/schema';
import { getLabIdFromRequest } from './helpers';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const BillIdSchema = z.object({
  id: z.number().int().positive(),
});

const BillInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
});

const BillListSchema = z.object({
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'invoiceNumber', 'finalAmount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const BillUpdateSchema = z.object({
  id: z.number().int().positive(),
  isPaid: z.boolean().optional(),
  discount: z.string().optional(),
  tax: z.string().optional(),
  finalAmount: z.string().optional(),
});

const CreateBillSchema = z.object({
  patientId: z.coerce.number().int().positive(),
  testIds: z.array(z.coerce.number().int().positive()),
  discount: z.number().min(0).max(100).default(0),
  tax: z.number().min(0).max(100).default(0),
});

// ============================================
// API FUNCTIONS - ALL WITH LAB SECURITY
// ============================================

export const getBillById = createServerFn({ method: 'GET' })
  .inputValidator(BillIdSchema)
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      // Get bill - verify it belongs to user's lab
      const [bill] = await db
        .select()
        .from(billSchema)
        .where(
          and(
            eq(billSchema.id, data.id),
            eq(billSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(billSchema.deletedAt)
          )
        )
        .limit(1);

      if (!bill) {
        throw new Error('Bill not found or access denied');
      }

      // Get lab details
      const [lab] = await db
        .select()
        .from(labSchema)
        .where(eq(labSchema.id, labId))
        .limit(1);

      // Get patient
      const [patient] = await db
        .select()
        .from(patientSchema)
        .where(eq(patientSchema.id, bill.patientId))
        .limit(1);

      // Get patient tests with test details and doctor
      const patientTests = await db
        .select({
          patientTest: patientTestsSchema,
          test: testSchema,
          doctor: doctorSchema,
        })
        .from(patientTestsSchema)
        .leftJoin(testSchema, eq(patientTestsSchema.testId, testSchema.id))
        .leftJoin(doctorSchema, eq(patientTestsSchema.doctorId, doctorSchema.id))
        .where(eq(patientTestsSchema.billId, bill.id));

      // Normalize tests
      const normalizedTests = patientTests.map((pt) => ({
        ...pt,
        test: pt.test ? { ...pt.test, metadata: (pt.test.metadata as any) || {} } : null,
      }));

      return {
        success: true,
        data: {
          bill,
          lab,
          patient,
          tests: normalizedTests,
        },
      };
    } catch (error) {
      console.error('Error fetching bill:', error);
      throw new Error('Failed to fetch bill');
    }
  });

export const getBillByInvoiceNumber = createServerFn({ method: 'GET' })
  .inputValidator(BillInvoiceSchema)
  .handler(async ({ data, request }) => {
    try {
      const labId = await getLabIdFromRequest(request);

      const [bill] = await db
        .select()
        .from(billSchema)
        .where(
          and(
            eq(billSchema.invoiceNumber, data.invoiceNumber),
            eq(billSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(billSchema.deletedAt)
          )
        )
        .limit(1);

      if (!bill) {
        throw new Error('Bill not found');
      }

      return {
        success: true,
        data: bill,
      };
    } catch (error) {
      console.error('Error fetching bill by invoice:', error);
      throw new Error('Failed to fetch bill');
    }
  });

export const getAllBills = createServerFn({ method: 'GET' })
  .inputValidator(BillListSchema)
  .handler(async ({ data, request }) => {
    try {
      const labId = await getLabIdFromRequest(request);
      const { limit, offset, sortBy, sortOrder } = data;

      const bills = await db
        .select({
          bill: billSchema,
          patient: patientSchema,
        })
        .from(billSchema)
        .leftJoin(patientSchema, eq(billSchema.patientId, patientSchema.id))
        .where(and(eq(billSchema.labId, labId), isNull(billSchema.deletedAt)))
        .orderBy(
          sortOrder === 'asc'
            ? billSchema[sortBy as keyof typeof billSchema]
            : desc(billSchema[sortBy as keyof typeof billSchema])
        )
        .limit(limit)
        .offset(offset);

      const countResult = await db
        .select({ count: count() })
        .from(billSchema)
        .where(and(eq(billSchema.labId, labId), isNull(billSchema.deletedAt)));

      const totalCount = Number(countResult[0]?.count || 0);

      return {
        success: true,
        data: bills,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      };
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw new Error('Failed to fetch bills');
    }
  });

export const updateBill = createServerFn({ method: 'POST' })
  .inputValidator(BillUpdateSchema)
  .handler(async ({ data, request }) => {
    try {
      const labId = await getLabIdFromRequest(request);

      // Verify bill exists and belongs to user's lab
      const [existingBill] = await db
        .select()
        .from(billSchema)
        .where(
          and(
            eq(billSchema.id, data.id),
            eq(billSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(billSchema.deletedAt)
          )
        )
        .limit(1);

      if (!existingBill) {
        throw new Error('Bill not found or access denied');
      }

      const updateData: any = { updatedAt: new Date() };

      if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;
      if (data.discount !== undefined) updateData.discount = data.discount;
      if (data.tax !== undefined) updateData.tax = data.tax;
      if (data.finalAmount !== undefined) updateData.finalAmount = data.finalAmount;

      const [updatedBill] = await db
        .update(billSchema)
        .set(updateData)
        .where(eq(billSchema.id, data.id))
        .returning();

      return {
        success: true,
        data: updatedBill,
        message: 'Bill updated successfully',
      };
    } catch (error) {
      console.error('Error updating bill:', error);
      throw new Error('Failed to update bill');
    }
  });

export const markBillAsPaid = createServerFn({ method: 'POST' })
  .inputValidator(BillIdSchema)
  .handler(async ({ data, request }) => {
    try {
      const labId = await getLabIdFromRequest(request);

      // Verify bill exists and belongs to user's lab
      const [bill] = await db
        .select()
        .from(billSchema)
        .where(
          and(
            eq(billSchema.id, data.id),
            eq(billSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(billSchema.deletedAt)
          )
        )
        .limit(1);

      if (!bill) {
        throw new Error('Bill not found or access denied');
      }

      const [updatedBill] = await db
        .update(billSchema)
        .set({ isPaid: true, updatedAt: new Date() })
        .where(eq(billSchema.id, data.id))
        .returning();

      return {
        success: true,
        data: updatedBill,
        message: 'Bill marked as paid',
      };
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      throw new Error('Failed to mark bill as paid');
    }
  });

export const searchBills = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      query: z.string().min(1),
      limit: z.number().int().positive().max(100).default(20),
      offset: z.number().int().min(0).default(0),
    })
  )
  .handler(async ({ data, request }) => {
    try {
      const { query, limit, offset } = data;
      const searchPattern = `%${query}%`;

      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      const bills = await db
        .select({
          bill: billSchema,
          patient: patientSchema,
        })
        .from(billSchema)
        .leftJoin(patientSchema, eq(billSchema.patientId, patientSchema.id))
        .where(
          and(
            eq(billSchema.labId, labId), // CRITICAL: Filter by labId
            or(
              ilike(billSchema.invoiceNumber, searchPattern),
              ilike(patientSchema.name, searchPattern)
            ),
            isNull(billSchema.deletedAt)
          )
        )
        .orderBy(desc(billSchema.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await db
        .select({ count: count() })
        .from(billSchema)
        .leftJoin(patientSchema, eq(billSchema.patientId, patientSchema.id))
        .where(
          and(
            eq(billSchema.labId, labId), // CRITICAL: Filter by labId
            or(
              ilike(billSchema.invoiceNumber, searchPattern),
              ilike(patientSchema.name, searchPattern)
            ),
            isNull(billSchema.deletedAt)
          )
        );

      const totalCount = Number(countResult[0]?.count || 0);

      return {
        success: true,
        data: bills,
        query,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      };
    } catch (error) {
      console.error('Error searching bills:', error);
      throw new Error('Failed to search bills');
    }
  });

// ============================================
// CREATE BILL FUNCTION
// ============================================

export const createBill = createServerFn({ method: 'POST' })
  .inputValidator(CreateBillSchema)
  .handler(async ({ data, request }) => {
    try {
      const labId = await getLabIdFromRequest(request);

      // Verify patient exists and belongs to lab
      const [patient] = await db
        .select()
        .from(patientSchema)
        .where(
          and(
            eq(patientSchema.id, data.patientId),
            eq(patientSchema.labId, labId),
            isNull(patientSchema.deletedAt)
          )
        )
        .limit(1);

      if (!patient) {
        throw new Error('Patient not found or access denied');
      }

      // Get all selected tests with their prices
      const selectedTests = await db
        .select()
        .from(testSchema)
        .where(
          and(
            eq(testSchema.labId, labId),
            data.testIds.length > 0
              ? or(...data.testIds.map((id) => eq(testSchema.id, id)))
              : undefined
          )
        );

      if (selectedTests.length === 0) {
        throw new Error('No valid tests found');
      }

      // Calculate subtotal from test prices
      const subtotal = selectedTests.reduce((sum, test) => {
        return sum + (parseFloat(test.price || '0') || 0);
      }, 0);

      // Apply discount and tax
      const discountAmount = (subtotal * data.discount) / 100;
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = (afterDiscount * data.tax) / 100;
      const finalAmount = afterDiscount + taxAmount;

      // Generate invoice number
      const now = new Date();
      const invoiceNumber = `INV-${labId}-${now.getTime()}`;

      // Create bill record
      const [newBill] = await db
        .insert(billSchema)
        .values({
          labId,
          patientId: data.patientId,
          invoiceNumber,
          subtotal: subtotal.toString(),
          discount: data.discount.toString(),
          tax: data.tax.toString(),
          finalAmount: finalAmount.toString(),
          isPaid: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Create patient test records
      if (newBill) {
        await db.insert(patientTestsSchema).values(
          selectedTests.map((test) => ({
            patientId: data.patientId,
            testId: test.id,
            billId: newBill.id,
            result: null,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }

      return {
        success: true,
        data: newBill,
        message: 'Bill created successfully',
      };
    } catch (error) {
      console.error('Error creating bill:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create bill'
      );
    }
  });
