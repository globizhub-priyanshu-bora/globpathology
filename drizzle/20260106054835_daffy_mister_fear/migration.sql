CREATE TABLE "billSchema" (
	"id" serial PRIMARY KEY,
	"labId" integer NOT NULL,
	"patientId" integer NOT NULL,
	"invoiceNumber" text NOT NULL UNIQUE,
	"totalAmount" numeric NOT NULL,
	"discount" numeric,
	"tax" numeric,
	"finalAmount" numeric NOT NULL,
	"isPaid" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "doctorSchema" (
	"id" serial PRIMARY KEY,
	"labId" integer NOT NULL,
	"registrationNumber" text,
	"name" text NOT NULL,
	"gender" text,
	"specialization" text,
	"phoneNumber" bigint,
	"photoDocument" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "labSchema" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"addressLine1" text,
	"logo" text,
	"photoDocument" text,
	"gstinNumber" text UNIQUE,
	"registrationNumber" text UNIQUE,
	"state" text,
	"country" text,
	"pincode" integer,
	"phoneNumber" bigint,
	"email" text UNIQUE,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "patientSchema" (
	"id" serial PRIMARY KEY,
	"labId" integer NOT NULL,
	"name" text NOT NULL,
	"dateOfBirth" date,
	"age" integer,
	"gender" text,
	"phoneNumber" bigint,
	"addressLine1" text,
	"city" text,
	"state" text,
	"country" text,
	"pincode" integer,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patientTestsSchema" (
	"id" serial PRIMARY KEY,
	"labId" integer NOT NULL,
	"patientId" integer NOT NULL,
	"testId" integer NOT NULL,
	"doctorId" integer,
	"billId" integer,
	"status" text NOT NULL,
	"reportDeliveryDate" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "reportSchema" (
	"id" serial PRIMARY KEY,
	"labId" integer NOT NULL,
	"patientTestId" integer NOT NULL,
	"billId" integer,
	"status" text DEFAULT 'pending',
	"notes" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "sampleCollectionSchema" (
	"id" serial PRIMARY KEY,
	"labId" integer NOT NULL,
	"patientTestId" integer NOT NULL,
	"sampleCollectionTime" timestamp,
	"sampleCollectionPlace" text,
	"sampleCollectorName" text,
	"sampleArrivalTime" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "sessionSchema" (
	"id" text PRIMARY KEY,
	"userId" integer NOT NULL,
	"labId" integer NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"isAdmin" boolean DEFAULT false,
	"permissions" json,
	"hasCompletedSetup" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now(),
	"expiresAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testParamSchema" (
	"id" serial PRIMARY KEY,
	"labId" integer NOT NULL,
	"name" text NOT NULL,
	"unit" text,
	"price" numeric,
	"referenceRanges" json,
	"metadata" json,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "testResultsSchema" (
	"id" serial PRIMARY KEY,
	"labId" integer NOT NULL,
	"patientTestId" integer NOT NULL,
	"result" json,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "testSchema" (
	"id" serial PRIMARY KEY,
	"labId" integer NOT NULL,
	"name" text NOT NULL,
	"price" numeric NOT NULL,
	"metadata" json,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "userSchema" (
	"id" serial PRIMARY KEY,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"phoneNumber" bigint,
	"permissions" json,
	"createdBy" integer,
	"isAdmin" boolean DEFAULT false,
	"labId" integer,
	"hasCompletedSetup" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"deletedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "billSchema" ADD CONSTRAINT "billSchema_labId_labSchema_id_fkey" FOREIGN KEY ("labId") REFERENCES "labSchema"("id");--> statement-breakpoint
ALTER TABLE "billSchema" ADD CONSTRAINT "billSchema_patientId_patientSchema_id_fkey" FOREIGN KEY ("patientId") REFERENCES "patientSchema"("id");--> statement-breakpoint
ALTER TABLE "doctorSchema" ADD CONSTRAINT "doctorSchema_labId_labSchema_id_fkey" FOREIGN KEY ("labId") REFERENCES "labSchema"("id");--> statement-breakpoint
ALTER TABLE "patientSchema" ADD CONSTRAINT "patientSchema_labId_labSchema_id_fkey" FOREIGN KEY ("labId") REFERENCES "labSchema"("id");--> statement-breakpoint
ALTER TABLE "patientTestsSchema" ADD CONSTRAINT "patientTestsSchema_labId_labSchema_id_fkey" FOREIGN KEY ("labId") REFERENCES "labSchema"("id");--> statement-breakpoint
ALTER TABLE "patientTestsSchema" ADD CONSTRAINT "patientTestsSchema_patientId_patientSchema_id_fkey" FOREIGN KEY ("patientId") REFERENCES "patientSchema"("id");--> statement-breakpoint
ALTER TABLE "patientTestsSchema" ADD CONSTRAINT "patientTestsSchema_testId_testSchema_id_fkey" FOREIGN KEY ("testId") REFERENCES "testSchema"("id");--> statement-breakpoint
ALTER TABLE "patientTestsSchema" ADD CONSTRAINT "patientTestsSchema_doctorId_doctorSchema_id_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctorSchema"("id");--> statement-breakpoint
ALTER TABLE "patientTestsSchema" ADD CONSTRAINT "patientTestsSchema_billId_billSchema_id_fkey" FOREIGN KEY ("billId") REFERENCES "billSchema"("id");--> statement-breakpoint
ALTER TABLE "reportSchema" ADD CONSTRAINT "reportSchema_labId_labSchema_id_fkey" FOREIGN KEY ("labId") REFERENCES "labSchema"("id");--> statement-breakpoint
ALTER TABLE "reportSchema" ADD CONSTRAINT "reportSchema_patientTestId_patientTestsSchema_id_fkey" FOREIGN KEY ("patientTestId") REFERENCES "patientTestsSchema"("id");--> statement-breakpoint
ALTER TABLE "reportSchema" ADD CONSTRAINT "reportSchema_billId_billSchema_id_fkey" FOREIGN KEY ("billId") REFERENCES "billSchema"("id");--> statement-breakpoint
ALTER TABLE "sampleCollectionSchema" ADD CONSTRAINT "sampleCollectionSchema_labId_labSchema_id_fkey" FOREIGN KEY ("labId") REFERENCES "labSchema"("id");--> statement-breakpoint
ALTER TABLE "sampleCollectionSchema" ADD CONSTRAINT "sampleCollectionSchema_patientTestId_patientTestsSchema_id_fkey" FOREIGN KEY ("patientTestId") REFERENCES "patientTestsSchema"("id");--> statement-breakpoint
ALTER TABLE "sessionSchema" ADD CONSTRAINT "sessionSchema_userId_userSchema_id_fkey" FOREIGN KEY ("userId") REFERENCES "userSchema"("id");--> statement-breakpoint
ALTER TABLE "sessionSchema" ADD CONSTRAINT "sessionSchema_labId_labSchema_id_fkey" FOREIGN KEY ("labId") REFERENCES "labSchema"("id");--> statement-breakpoint
ALTER TABLE "testParamSchema" ADD CONSTRAINT "testParamSchema_labId_labSchema_id_fkey" FOREIGN KEY ("labId") REFERENCES "labSchema"("id");--> statement-breakpoint
ALTER TABLE "testResultsSchema" ADD CONSTRAINT "testResultsSchema_labId_labSchema_id_fkey" FOREIGN KEY ("labId") REFERENCES "labSchema"("id");--> statement-breakpoint
ALTER TABLE "testResultsSchema" ADD CONSTRAINT "testResultsSchema_patientTestId_patientTestsSchema_id_fkey" FOREIGN KEY ("patientTestId") REFERENCES "patientTestsSchema"("id");--> statement-breakpoint
ALTER TABLE "testSchema" ADD CONSTRAINT "testSchema_labId_labSchema_id_fkey" FOREIGN KEY ("labId") REFERENCES "labSchema"("id");--> statement-breakpoint
ALTER TABLE "userSchema" ADD CONSTRAINT "userSchema_labId_labSchema_id_fkey" FOREIGN KEY ("labId") REFERENCES "labSchema"("id");