import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from './schema.ts'
export const db = drizzle(process.env.DATABASE_URL || "postgresql://neondb_owner:npg_4SrBmPWKq8Od@ep-rapid-darkness-a1dhqbcj-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require", {schema});