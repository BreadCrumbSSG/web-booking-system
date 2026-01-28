import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 4000;
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://app:app@localhost:5432/bookings'
});

app.use(cors({ origin: ALLOW_ORIGIN }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Fare rules
const FARE_RULES = {
  economy: { base: 3.0, perKm: 0.9, perMin: 0.2 },
  premium: { base: 5.0, perKm: 1.4, perMin: 0.35 },
  xl: { base: 6.5, perKm: 1.8, perMin: 0.45 }
};

function calcFare(category, distanceKm, durationMin) {
  const rules = FARE_RULES[category];
  if (!rules) throw new Error('Invalid category');
  const fare = rules.base + rules.perKm * distanceKm + rules.perMin * durationMin;
  return Math.max(3, Math.round(fare * 100) / 100);
}

app.get('/api/fare', (req, res) => {
  const { category = 'economy', distanceKm = '0', durationMin = '0' } = req.query;
  try {
    const fare = calcFare(String(category), Number(distanceKm), Number(durationMin));
    res.json({ category, distanceKm: Number(distanceKm), durationMin: Number(durationMin), fare });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const {
      pickup_address,
      dropoff_address,
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      distance_km,
      duration_min,
      category,
      fare
    } = req.body;

    // Basic validation
    if (!pickup_address || !dropoff_address) return res.status(400).json({ error: 'Missing addresses' });

    const insert = `
      INSERT INTO bookings (
        pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
        distance_km, duration_min, category, fare
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;
    const values = [
      pickup_address,
      dropoff_address,
      Number(pickup_lat),
      Number(pickup_lng),
      Number(dropoff_lat),
      Number(dropoff_lng),
      Number(distance_km),
      Number(duration_min),
      String(category),
      Number(fare)
    ];
    const result = await pool.query(insert, values);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
