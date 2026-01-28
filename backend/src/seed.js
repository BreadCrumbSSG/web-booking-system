import dotenv from 'dotenv';
import pkg from 'pg';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const insert = `
    INSERT INTO bookings (
      pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
      distance_km, duration_min, category, fare
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *;
  `;
  const values = [
    'Seed Pickup', 'Seed Dropoff', 37.7749, -122.4194, 37.7849, -122.4094, 1.2, 5, 'economy', 5.67
  ];
  const res = await pool.query(insert, values);
  console.log('Inserted:', res.rows[0]);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
