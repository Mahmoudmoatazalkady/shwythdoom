import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import XLSX from 'xlsx';
import fs from 'fs';
import dotenv from 'dotenv';
import sendOrderEmails from './sendEmail.js';
dotenv.config();

const app = express();
const PORT = 3001;
const EXCEL_FILE = 'orders.xlsx';

app.use(cors());
app.use(bodyParser.json());

// Helper: Load or create workbook
function loadOrCreateWorkbook() {
  if (fs.existsSync(EXCEL_FILE)) {
    return XLSX.readFile(EXCEL_FILE);
  } else {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, EXCEL_FILE);
    return wb;
  }
}

// POST /api/orders
app.post('/api/orders', (req, res) => {
  const order = req.body;
  if (!order || typeof order !== 'object') {
    return res.status(400).json({ error: 'Invalid order data' });
  }
  // Load workbook
  const wb = loadOrCreateWorkbook();
  const ws = wb.Sheets['Orders'] || XLSX.utils.json_to_sheet([]);
  // Convert worksheet to JSON, append new order
  const orders = XLSX.utils.sheet_to_json(ws);
  orders.push({ ...order, date: new Date().toISOString() });
  // Write back to worksheet and file
  const newWs = XLSX.utils.json_to_sheet(orders);
  wb.Sheets['Orders'] = newWs;
  XLSX.writeFile(wb, EXCEL_FILE);

  // Send emails to customer and company
  sendOrderEmails(order, (err, info) => {
    if (err) {
      console.error('Email error:', err);
      return res.status(500).json({ success: false, error: 'Order saved but email failed.' });
    }
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Order backend running on http://localhost:${PORT}`);
});
