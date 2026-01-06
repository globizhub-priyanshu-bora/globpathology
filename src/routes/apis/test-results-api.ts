import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { 
  billSchema, 
  doctorSchema,
  patientSchema,
  patientTestsSchema, 
  testParamSchema, 
  testResultsSchema,
  testSchema
} from '@/db/schema';
import { getLabIdFromRequest } from './helpers';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const TestResultCreateSchema = z.object({
  patientTestId: z.number().int().positive(),
  results: z.array(
    z.object({
      parameterId: z.number().int().positive(),
      parameterName: z.string(),
      value: z.string(),
      unit: z.string().optional(),
      referenceRange: z.string().optional(),
      isAbnormal: z.boolean().optional(),
      status: z.enum(['Low', 'Normal', 'High']).optional(),
    })
  ),
  impression: z.string().optional(),
});

const TestResultUpdateSchema = z.object({
  id: z.number().int().positive(),
  results: z.array(
    z.object({
      parameterId: z.number().int().positive(),
      parameterName: z.string(),
      value: z.string(),
      unit: z.string().optional(),
      referenceRange: z.string().optional(),
      isAbnormal: z.boolean().optional(),
      status: z.enum(['Low', 'Normal', 'High']).optional(),
    })
  ),
  impression: z.string().optional(),
});

const PatientTestIdSchema = z.object({
  patientTestId: z.number().int().positive(),
});

const TestResultIdSchema = z.object({
  id: z.number().int().positive(),
});

const GetTestResultDataSchema = z.object({
  patientTestId: z.number().int().positive(),
});

const PatientIdSchema = z.object({
  patientId: z.number().int().positive(),
});

// ============================================
// API FUNCTIONS - ALL WITH LAB SECURITY
// ============================================

export const getTestResultData = createServerFn({ method: 'GET' })
  .inputValidator(GetTestResultDataSchema)
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      // Get patient test with lab verification
      const [patientTest] = await db
        .select()
        .from(patientTestsSchema)
        .where(
          and(
            eq(patientTestsSchema.id, data.patientTestId),
            eq(patientTestsSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(patientTestsSchema.deletedAt)
          )
        )
        .limit(1);

      if (!patientTest) {
        throw new Error('Patient test not found or access denied');
      }

      // Get test details
      const [test] = await db
        .select()
        .from(testSchema)
        .where(
          and(
            eq(testSchema.id, patientTest.testId),
            eq(testSchema.labId, labId) // CRITICAL: Verify ownership
          )
        )
        .limit(1);

      if (!test) {
        throw new Error('Test details not found');
      }

      // Get patient details
      const [patient] = await db
        .select()
        .from(patientSchema)
        .where(
          and(
            eq(patientSchema.id, patientTest.patientId),
            eq(patientSchema.labId, labId) // CRITICAL: Verify ownership
          )
        )
        .limit(1);

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Get bill details
      let bill = null;
      if (patientTest.billId) {
        [bill] = await db
          .select()
          .from(billSchema)
          .where(
            and(
              eq(billSchema.id, patientTest.billId),
              eq(billSchema.labId, labId) // CRITICAL: Verify ownership
            )
          )
          .limit(1);
      }

      // Get doctor details if exists
      let doctor = null;
      if (patientTest.doctorId) {
        [doctor] = await db
          .select()
          .from(doctorSchema)
          .where(
            and(
              eq(doctorSchema.id, patientTest.doctorId),
              eq(doctorSchema.labId, labId) // CRITICAL: Verify ownership
            )
          )
          .limit(1);
      }

      // Get test parameters with reference ranges
      const parameterIds = (test.metadata as any)?.parameterIds || [];
      let parameters: any[] = [];

      if (parameterIds.length > 0) {
        parameters = await db
          .select()
          .from(testParamSchema)
          .where(
            and(
              inArray(testParamSchema.id, parameterIds),
              eq(testParamSchema.labId, labId), // CRITICAL: Verify ownership
              isNull(testParamSchema.deletedAt)
            )
          );
      }

      // Check if results already exist
      const [existingResult] = await db
        .select()
        .from(testResultsSchema)
        .where(
          and(
            eq(testResultsSchema.patientTestId, data.patientTestId),
            eq(testResultsSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(testResultsSchema.deletedAt)
          )
        )
        .limit(1);

      return {
        success: true,
        data: {
          patientTest,
          test,
          patient,
          doctor,
          bill,
          parameters: parameters.map(p => ({
            ...p,
            metadata: (p.metadata as any) || {},
            referenceRanges: (p.referenceRanges as any) || []
          })),
          existingResult: existingResult || null
        },
      };
    } catch (error) {
      console.error('Error fetching test result data:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch test result data'
      );
    }
  });

export const createTestResult = createServerFn({ method: 'POST' })
  .inputValidator(TestResultCreateSchema)
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      // Check if patient test exists AND belongs to user's lab
      const [patientTest] = await db
        .select()
        .from(patientTestsSchema)
        .where(
          and(
            eq(patientTestsSchema.id, data.patientTestId),
            eq(patientTestsSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(patientTestsSchema.deletedAt)
          )
        )
        .limit(1);

      if (!patientTest) {
        throw new Error('Patient test not found or access denied');
      }

      // Check if results already exist
      const [existing] = await db
        .select()
        .from(testResultsSchema)
        .where(
          and(
            eq(testResultsSchema.patientTestId, data.patientTestId),
            eq(testResultsSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(testResultsSchema.deletedAt)
          )
        )
        .limit(1);

      if (existing) {
        throw new Error('Test results already exist. Use update instead.');
      }

      // Create test results WITH labId
      const resultData = {
        results: data.results,
        impression: data.impression || null
      };

      const [newResult] = await db
        .insert(testResultsSchema)
        .values({
          labId, // CRITICAL: Assign to user's lab
          patientTestId: data.patientTestId,
          result: resultData,
        })
        .returning();

      // Update patient test status to 'completed'
      await db
        .update(patientTestsSchema)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(patientTestsSchema.id, data.patientTestId),
            eq(patientTestsSchema.labId, labId) // CRITICAL
          )
        );

      return {
        success: true,
        message: 'Test results saved successfully',
        data: newResult,
      };
    } catch (error) {
      console.error('Error creating test results:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to save test results'
      );
    }
  });

export const updateTestResult = createServerFn({ method: 'POST' })
  .inputValidator(TestResultUpdateSchema)
  .handler(async ({ data, request }) => {
    try {
      const { id, results, impression } = data;
      
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      const [existing] = await db
        .select()
        .from(testResultsSchema)
        .where(
          and(
            eq(testResultsSchema.id, id),
            eq(testResultsSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(testResultsSchema.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        throw new Error('Test result not found or access denied');
      }

      const resultData = {
        results,
        impression: impression || null
      };

      const [updated] = await db
        .update(testResultsSchema)
        .set({
          result: resultData,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(testResultsSchema.id, id),
            eq(testResultsSchema.labId, labId) // CRITICAL: Ensure update is for user's lab
          )
        )
        .returning();

      return {
        success: true,
        message: 'Test results updated successfully',
        data: updated,
      };
    } catch (error) {
      console.error('Error updating test results:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update test results'
      );
    }
  });

export const getTestResultByPatientTestId = createServerFn({ method: 'GET' })
  .inputValidator(PatientTestIdSchema)
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      const [result] = await db
        .select()
        .from(testResultsSchema)
        .where(
          and(
            eq(testResultsSchema.patientTestId, data.patientTestId),
            eq(testResultsSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(testResultsSchema.deletedAt)
          )
        )
        .limit(1);

      return {
        success: true,
        data: result || null,
      };
    } catch (error) {
      console.error('Error fetching test result:', error);
      throw new Error('Failed to fetch test result');
    }
  });

export const deleteTestResult = createServerFn({ method: 'POST' })
  .inputValidator(TestResultIdSchema)
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      const [existing] = await db
        .select()
        .from(testResultsSchema)
        .where(
          and(
            eq(testResultsSchema.id, data.id),
            eq(testResultsSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(testResultsSchema.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        throw new Error('Test result not found or access denied');
      }

      await db
        .update(testResultsSchema)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(testResultsSchema.id, data.id),
            eq(testResultsSchema.labId, labId) // CRITICAL
          )
        );

      // Update patient test status back to 'pending'
      await db
        .update(patientTestsSchema)
        .set({
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(patientTestsSchema.id, existing.patientTestId),
            eq(patientTestsSchema.labId, labId) // CRITICAL
          )
        );

      return {
        success: true,
        message: 'Test result deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting test result:', error);
      throw new Error('Failed to delete test result');
    }
  });

export const getPatientTestsWithResults = createServerFn({ method: 'GET' })
  .inputValidator(PatientIdSchema)
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      // Get all patient tests for this patient in this lab
      const patientTests = await db
        .select({
          patientTest: patientTestsSchema,
          test: testSchema,
          doctor: doctorSchema,
        })
        .from(patientTestsSchema)
        .leftJoin(testSchema, eq(patientTestsSchema.testId, testSchema.id))
        .leftJoin(doctorSchema, eq(patientTestsSchema.doctorId, doctorSchema.id))
        .where(
          and(
            eq(patientTestsSchema.patientId, data.patientId),
            eq(patientTestsSchema.labId, labId), // CRITICAL: Filter by labId
            isNull(patientTestsSchema.deletedAt)
          )
        );

      // Get results for each test
      const testsWithResults = await Promise.all(
        patientTests.map(async (pt) => {
          const [result] = await db
            .select()
            .from(testResultsSchema)
            .where(
              and(
                eq(testResultsSchema.patientTestId, pt.patientTest.id),
                eq(testResultsSchema.labId, labId), // CRITICAL: Filter by labId
                isNull(testResultsSchema.deletedAt)
              )
            )
            .limit(1);

          return {
            ...pt,
            test: pt.test ? { ...pt.test, metadata: (pt.test.metadata as any) || {} } : null,
            result: result || null,
            hasResult: !!result
          };
        })
      );

      return {
        success: true,
        data: testsWithResults,
      };
    } catch (error) {
      console.error('Error fetching patient tests with results:', error);
      throw new Error('Failed to fetch patient tests with results');
    }
  });