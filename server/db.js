import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
const sql = neon(`${process.env.DATABASE_URL}`); //to read and write to the database

export default sql;