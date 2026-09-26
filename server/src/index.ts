import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import warehouseRoutes from './routes/warehouse';
import productRoutes from './routes/products';
import operationRoutes, { ensureStandardLocations } from './routes/operations';
import ledgerRoutes from './routes/ledger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'StockSense API Engine',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/ledger', ledgerRoutes);

// Initialize standard virtual locations on startup
ensureStandardLocations()
  .then(() => {
    console.log('[SYSTEM] Standard virtual locations verified.');
  })
  .catch((err) => {
    console.error('[SYSTEM] Error initializing standard locations:', err);
  });

app.listen(PORT, () => {
  console.log(`🚀 StockSense Backend Server running on http://localhost:${PORT}`);
});
