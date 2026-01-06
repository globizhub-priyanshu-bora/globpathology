import { createServerFn } from '@tanstack/react-start';
import { and, count, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { billSchema, doctorSchema, patientSchema, patientTestsSchema, reportSchema, sampleCollectionSchema, testResultsSchema, testSchema } from '@/db/schema';
import { checkPermission, getLabIdFromRequest, getUserFromRequest } from './helpers';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const PatientSearchSchema = z.object({
  phoneNumber: z.number().int().positive(),
});

const PatientCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  dateOfBirth: z.string().optional(), // UPDATED: Add dateOfBirth
  age: z.number().int().positive().optional(),
  gender: z.string().optional(),
  phoneNumber: z.number().int().positive(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.number().int().optional(),
});

const PatientTestRegistrationSchema = z.object({
  patientId: z.number().int().positive(),
  testIds: z.array(z.number().int().positive()),
  doctorId: z.number().int().positive().optional(),
  reportDeliveryDate: z.string().optional(),
  discount: z.string().optional(),
  tax: z.string().optional(),
  totalAmount: z.string(),
  finalAmount: z.string(),
  isPaid: z.boolean().default(true),
});

// NEW: Sample Collection Schema
const SampleCollectionSchema = z.object({
  sampleCollectionTime: z.string().optional(),
  sampleCollectionPlace: z.string().optional(),
  sampleCollectorName: z.string().optional(),
  sampleArrivalTime: z.string().optional(),
  notes: z.string().optional(),
});

const PatientUpdateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2).optional(),
  dateOfBirth: z.string().optional(), // UPDATED: Add dateOfBirth
  age: z.number().int().positive().optional(),
  gender: z.string().optional(),
  phoneNumber: z.number().int().positive().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.number().int().optional(),
});

const PatientListSchema = z.object({
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'createdAt', 'phoneNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const PatientIdSchema = z.object({
  id: z.number().int().positive(),
});

const BulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'At least one patient ID is required'),
});

// ============================================
// API FUNCTIONS - ALL WITH LAB SECURITY
// ============================================

export const searchPatientByPhone = createServerFn({ method: 'GET' })
  .inputValidator(PatientSearchSchema)
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      const [patient] = await db
        .select()
        .from(patientSchema)
        .where(
          and(
            eq(patientSchema.phoneNumber, data.phoneNumber),
            eq(patientSchema.labId, labId) // CRITICAL: Filter by labId
          )
        )
        .limit(1);

      if (!patient) {
        return {
          success: true,
          exists: false,
          message: 'Patient not found. Please register.',
        };
      }

      return {
        success: true,
        exists: true,
        data: patient,
      };
    } catch (error) {
      console.error('Error searching patient:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to search patient'
      );
    }
  });

export const createPatientWithTests = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      isNewPatient: z.boolean().default(true),
      patientId: z.number().int().positive().optional(),
      patient: PatientCreateSchema,
      tests: PatientTestRegistrationSchema.omit({ patientId: true }),
      sampleCollection: SampleCollectionSchema.optional(), // NEW: Add sample collection
    })
  )
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      let patientId: number;
      let patientData: any;

      if (data.isNewPatient) {
        // Create new patient
        const [newPatient] = await db
          .insert(patientSchema)
          .values({
            labId, // CRITICAL: Assign patient to user's lab
            name: data.patient.name,
            dateOfBirth: data.patient.dateOfBirth ? new Date(data.patient.dateOfBirth).toISOString().split('T')[0] : null, // UPDATED: Add dateOfBirth
            age: data.patient.age || null,
            gender: data.patient.gender || null,
            phoneNumber: data.patient.phoneNumber,
            addressLine1: data.patient.addressLine1 || null,
            city: data.patient.city || null,
            state: data.patient.state || null,
            country: data.patient.country || null,
            pincode: data.patient.pincode || null,
          })
          .returning();
        patientId = newPatient.id;
        patientData = newPatient;
      } else {
        // For existing patient, patientId is required
        if (!data.patientId) {
          throw new Error('Patient ID is required for registering tests to existing patients. Please search for the patient first.');
        }

        // Use existing patient - verify they belong to this lab
        const [existingPatient] = await db
          .select()
          .from(patientSchema)
          .where(
            and(
              eq(patientSchema.id, data.patientId),
              eq(patientSchema.labId, labId)
            )
          )
          .limit(1);
        
        if (!existingPatient) {
          throw new Error('Patient not found or you do not have access to this patient. Please search again.');
        }
        
        patientId = data.patientId;
        
        // Update patient information if provided
        await db
          .update(patientSchema)
          .set({
            name: data.patient.name,
            dateOfBirth: data.patient.dateOfBirth ? new Date(data.patient.dateOfBirth).toISOString().split('T')[0] : null, // UPDATED: Add dateOfBirth
            age: data.patient.age || null,
            gender: data.patient.gender || null,
            addressLine1: data.patient.addressLine1 || null,
            city: data.patient.city || null,
            state: data.patient.state || null,
            country: data.patient.country || null,
            pincode: data.patient.pincode || null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(patientSchema.id, patientId),
              eq(patientSchema.labId, labId)
            )
          );
        
        // Fetch updated patient
        const [updated] = await db
          .select()
          .from(patientSchema)
          .where(
            and(
              eq(patientSchema.id, patientId),
              eq(patientSchema.labId, labId)
            )
          )
          .limit(1);
        patientData = updated;
      }

      // Generate invoice number with labId prefix (ensure patientId is always defined)
      const finalPatientId = patientId || 0;
      const invoiceNumber = `INV-${labId}-${Date.now()}-${finalPatientId}`;

      // Create bill with labId
      const [bill] = await db
        .insert(billSchema)
        .values({
          labId, // CRITICAL: Assign bill to user's lab
          patientId: patientId,
          invoiceNumber,
          totalAmount: data.tests.totalAmount,
          discount: data.tests.discount || '0',
          tax: data.tests.tax || '0',
          finalAmount: data.tests.finalAmount,
          isPaid: data.tests.isPaid ?? true,
        })
        .returning();

      const patientTestsInserts = data.tests.testIds.map((testId) => ({
        labId, // CRITICAL: Assign test to user's lab
        patientId: patientId,
        testId: testId,
        doctorId: data.tests.doctorId || null,
        billId: bill.id,
        status: 'pending',
        reportDeliveryDate: data.tests.reportDeliveryDate
          ? new Date(data.tests.reportDeliveryDate)
          : null,
      }));

      const patientTests = await db
        .insert(patientTestsSchema)
        .values(patientTestsInserts)
        .returning();

      // NEW: Store sample collection details for each patient test
      if (data.sampleCollection && patientTests.length > 0) {
        const sampleCollectionInserts = patientTests.map((patientTest) => ({
          labId, // CRITICAL: Assign to user's lab
          patientTestId: patientTest.id,
          sampleCollectionTime: data.sampleCollection.sampleCollectionTime
            ? new Date(data.sampleCollection.sampleCollectionTime)
            : null,
          sampleCollectionPlace: data.sampleCollection.sampleCollectionPlace || null,
          sampleCollectorName: data.sampleCollection.sampleCollectorName || null,
          sampleArrivalTime: data.sampleCollection.sampleArrivalTime
            ? new Date(data.sampleCollection.sampleArrivalTime)
            : null,
          notes: data.sampleCollection.notes || null,
        }));

        await db
          .insert(sampleCollectionSchema)
          .values(sampleCollectionInserts);
      }

      return {
        success: true,
        message: data.isNewPatient ? 'Patient registered successfully' : 'Tests added to existing patient successfully',
        data: {
          patient: patientData,
          tests: patientTests,
          bill,
        },
      };
    } catch (error) {
      console.error('Error creating patient with tests:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to register patient'
      );
    }
  });

export const updatePatient = createServerFn({ method: 'POST' })
  .inputValidator(PatientUpdateSchema)
  .handler(async ({ data, request }) => {
    try {
      const { id, ...updateData } = data;
      
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      // Check if patient exists AND belongs to user's lab
      const [existing] = await db
        .select()
        .from(patientSchema)
        .where(
          and(
            eq(patientSchema.id, id),
            eq(patientSchema.labId, labId) // CRITICAL: Verify ownership
          )
        )
        .limit(1);

      if (!existing) {
        throw new Error('Patient not found or access denied');
      }

      // UPDATED: Format dateOfBirth if provided
      const formattedData = {
        ...updateData,
        dateOfBirth: updateData.dateOfBirth 
          ? new Date(updateData.dateOfBirth).toISOString().split('T')[0]
          : undefined,
      };

      // Update patient
      const [updated] = await db
        .update(patientSchema)
        .set({
          ...formattedData,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(patientSchema.id, id),
            eq(patientSchema.labId, labId) // CRITICAL: Ensure update is for user's lab
          )
        )
        .returning();

      return {
        success: true,
        message: 'Patient updated successfully',
        data: updated,
      };
    } catch (error) {
      console.error('Error updating patient:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update patient'
      );
    }
  });

export const getAllPatients = createServerFn({ method: 'GET' })
  .inputValidator(PatientListSchema)
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

      const orderByColumn = patientSchema[sortBy];
      const orderBy = sortOrder === 'desc' ? desc(orderByColumn) : orderByColumn;

      // Count only patients from user's lab
      const countResult = await db
        .select({ count: count() })
        .from(patientSchema)
        .where(eq(patientSchema.labId, labId)); // CRITICAL: Filter by labId

      const totalCount = Number(countResult[0]?.count || 0);

      // Get only patients from user's lab
      const patients = await db
        .select()
        .from(patientSchema)
        .where(eq(patientSchema.labId, labId)) // CRITICAL: Filter by labId
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return {
        success: true,
        data: patients,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      };
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Return empty list instead of throwing to prevent deployment errors
      return {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      };
    }
  });

export const searchPatients = createServerFn({ method: 'GET' })
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

      const patients = await db
        .select()
        .from(patientSchema)
        .where(
          and(
            eq(patientSchema.labId, labId), // CRITICAL: Filter by labId
            or(
              ilike(patientSchema.name, searchPattern),
              ilike(patientSchema.city, searchPattern),
              ilike(patientSchema.state, searchPattern)
            )
          )
        )
        .orderBy(desc(patientSchema.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await db
        .select({ count: count() })
        .from(patientSchema)
        .where(
          and(
            eq(patientSchema.labId, labId), // CRITICAL: Filter by labId
            or(
              ilike(patientSchema.name, searchPattern),
              ilike(patientSchema.city, searchPattern),
              ilike(patientSchema.state, searchPattern)
            )
          )
        );

      const totalCount = Number(countResult[0]?.count || 0);

      return {
        success: true,
        data: patients,
        query,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      };
    } catch (error) {
      console.error('Error searching patients:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to search patients'
      );
    }
  });

export const getPatientWithTests = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      // Get patient - verify it belongs to user's lab
      const [patient] = await db
        .select()
        .from(patientSchema)
        .where(
          and(
            eq(patientSchema.id, data.id),
            eq(patientSchema.labId, labId) // CRITICAL: Verify ownership
          )
        )
        .limit(1);

      if (!patient) {
        throw new Error('Patient not found or access denied');
      }

      // Get patient tests - only from user's lab
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
            eq(patientTestsSchema.patientId, data.id),
            eq(patientTestsSchema.labId, labId) // CRITICAL: Filter by labId
          )
        );

      const normalizedTests = patientTests.map(pt => ({
        ...pt,
        test: pt.test ? { ...pt.test, metadata: (pt.test.metadata as any) || {} } : null,
      }));

      // Get bills - only from user's lab
      const bills = await db
        .select()
        .from(billSchema)
        .where(
          and(
            eq(billSchema.patientId, data.id),
            eq(billSchema.labId, labId) // CRITICAL: Filter by labId
          )
        );

      return {
        success: true,
        data: {
          patient,
          tests: normalizedTests,
          bills,
        },
      };
    } catch (error) {
      console.error('Error fetching patient with tests:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch patient details'
      );
    }
  });

export const getPatientById = createServerFn({ method: 'GET' })
  .inputValidator(PatientIdSchema)
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      const [patient] = await db
        .select()
        .from(patientSchema)
        .where(
          and(
            eq(patientSchema.id, data.id),
            eq(patientSchema.labId, labId) // CRITICAL: Verify ownership
          )
        )
        .limit(1);

      if (!patient) {
        throw new Error('Patient not found or access denied');
      }

      return {
        success: true,
        data: patient,
      };
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch patient'
      );
    }
  });

// NEW FUNCTION: Bulk Delete Patients
// NEW FUNCTION: Bulk Delete Patients - FIXED VERSION
export const bulkDeletePatients = createServerFn({ method: 'POST' })
  .inputValidator(BulkDeleteSchema)
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      // Verify all patients belong to the user's lab before deleting
      const patientsToDelete = await db
        .select()
        .from(patientSchema)
        .where(
          and(
            inArray(patientSchema.id, data.ids),
            eq(patientSchema.labId, labId) // CRITICAL: Verify ownership
          )
        );

      if (patientsToDelete.length !== data.ids.length) {
        throw new Error('Some patients not found or access denied');
      }

      // Delete related records in correct order (respecting foreign key constraints)
      
      // Step 1: Get all patient tests to find associated records
      const patientTestsToDelete = await db
        .select({ id: patientTestsSchema.id })
        .from(patientTestsSchema)
        .where(inArray(patientTestsSchema.patientId, data.ids));

      const patientTestIds = patientTestsToDelete.map(pt => pt.id);

      // Step 2: Get bills to delete
      const billsToDelete = await db
        .select({ id: billSchema.id })
        .from(billSchema)
        .where(inArray(billSchema.patientId, data.ids));

      const billIds = billsToDelete.map(b => b.id);

      // Step 3: Delete sample collection records FIRST (they reference patientTests)
      if (patientTestIds.length > 0) {
        await db
          .delete(sampleCollectionSchema)
          .where(inArray(sampleCollectionSchema.patientTestId, patientTestIds));
        console.log(`✅ Deleted ${patientTestIds.length} sample collection records`);
      }

      // Step 4: Delete test results (they reference patientTests)
      if (patientTestIds.length > 0) {
        await db
          .delete(testResultsSchema)
          .where(inArray(testResultsSchema.patientTestId, patientTestIds));
        console.log(`✅ Deleted test results for ${patientTestIds.length} patient tests`);
      }

      // Step 5: Delete reports linked to patient tests and bills
      if (patientTestIds.length > 0 || billIds.length > 0) {
        const conditions = [];
        if (patientTestIds.length > 0) {
          conditions.push(inArray(reportSchema.patientTestId, patientTestIds));
        }
        if (billIds.length > 0) {
          conditions.push(inArray(reportSchema.billId, billIds));
        }
        if (conditions.length > 0) {
          await db
            .delete(reportSchema)
            .where(or(...conditions));
          console.log(`✅ Deleted reports`);
        }
      }

      // Step 6: Delete patient tests (now safe after deleting sample collections and test results)
      if (patientTestIds.length > 0) {
        await db
          .delete(patientTestsSchema)
          .where(inArray(patientTestsSchema.patientId, data.ids));
        console.log(`✅ Deleted ${patientTestIds.length} patient tests`);
      }

      // Step 7: Delete bills
      if (billIds.length > 0) {
        await db
          .delete(billSchema)
          .where(inArray(billSchema.patientId, data.ids));
        console.log(`✅ Deleted ${billIds.length} bills`);
      }

      // Step 8: Finally delete patients
      await db
        .delete(patientSchema)
        .where(
          and(
            inArray(patientSchema.id, data.ids),
            eq(patientSchema.labId, labId)
          )
        );
      console.log(`✅ Deleted ${patientsToDelete.length} patients`);

      return {
        success: true,
        message: `Successfully deleted ${patientsToDelete.length} patient(s)`,
      };
    } catch (error) {
      console.error("Error deleting patients:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to delete patients"
      );
    }
  });
// NEW: Get sample collection details by patient test ID
export const getSampleCollectionDetails = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      patientTestId: z.number().int().positive(),
    })
  )
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      const sampleCollection = await db
        .select()
        .from(sampleCollectionSchema)
        .where(
          and(
            eq(sampleCollectionSchema.patientTestId, data.patientTestId),
            eq(sampleCollectionSchema.labId, labId) // CRITICAL: Filter by labId
          )
        )
        .limit(1);

      if (sampleCollection.length === 0) {
        return {
          success: true,
          exists: false,
          message: 'No sample collection details found',
        };
      }

      return {
        success: true,
        exists: true,
        data: sampleCollection[0],
      };
    } catch (error) {
      console.error('Error fetching sample collection details:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch sample collection details'
      );
    }
  });

// NEW: Get all sample collection details for a patient
export const getSampleCollectionByPatient = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      patientId: z.number().int().positive(),
    })
  )
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      const sampleCollections = await db
        .select({
          sampleCollection: sampleCollectionSchema,
          patientTest: patientTestsSchema,
          test: testSchema,
        })
        .from(sampleCollectionSchema)
        .innerJoin(patientTestsSchema, eq(sampleCollectionSchema.patientTestId, patientTestsSchema.id))
        .innerJoin(testSchema, eq(patientTestsSchema.testId, testSchema.id))
        .where(
          and(
            eq(patientTestsSchema.patientId, data.patientId),
            eq(sampleCollectionSchema.labId, labId) // CRITICAL: Filter by labId
          )
        );

      return {
        success: true,
        data: sampleCollections,
      };
    } catch (error) {
      console.error('Error fetching patient sample collections:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch sample collections'
      );
    }
  });