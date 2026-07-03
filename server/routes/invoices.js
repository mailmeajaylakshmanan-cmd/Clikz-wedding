const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

// Helper to launch browser correctly in both local and Serverless/Vercel environments
async function launchBrowser() {
  const isLocal = !process.env.VERCEL && !process.env.AWS_REGION && process.env.NODE_ENV !== 'production';

  if (isLocal) {
    // Local Windows/Mac development
    const p = await import('puppeteer');
    const puppeteer = p.default || p;
    return await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } else {
    // Vercel / AWS Lambda / Serverless environment
    const p = await import('puppeteer-core');
    const puppeteerCore = p.default || p;
    const c = await import('@sparticuz/chromium');
    const chromium = c.default || c;

    return await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });
  }
}

// GET all invoices

router.get('/', auth, async (req, res) => {
  try {
    const { status, search, staffingStatus, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (staffingStatus) query.staffingStatus = staffingStatus;
    if (search) {
      query.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { invoiceNo: { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
      ];
    }
    const invoices = await secureFind(Invoice, query, req)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    const total = await Invoice.countDocuments({ ...query, studioId: req.studioId, isDeleted: false });
    res.json({ invoices, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single invoice
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await secureFindOne(Invoice, { _id: req.params.id }, req).populate('eventCategories').lean();
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET generate invoice PDF
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const invoice = await secureFindOne(Invoice, { _id: req.params.id }, req);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Ensure frontend URL is known
    const frontendUrl = req.headers.origin || req.headers.referer?.split('/invoices')[0] || 'http://localhost:5173';
    const targetUrl = `${frontendUrl}/invoices/${req.params.id}`;

    const browser = await launchBrowser();
    const page = await browser.newPage();

    // Pass the auth token to puppeteer so it can load the invoice data
    if (req.cookies?.token) {
      const urlObj = new URL(frontendUrl);
      await page.setCookie({
        name: 'token',
        value: req.cookies.token,
        domain: urlObj.hostname,
      });
    }

    // Bypass React PrivateRoute by setting localStorage before page loads
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('isAuthenticated', 'true');
    });

    // Await network idle to ensure data fetching is complete
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="Invoice-${invoice.invoiceNo}.pdf"`
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
});

// TEST GET generate invoice PDF (no auth)
router.get('/test/pdf', async (req, res) => {
  try {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// POST create invoice
router.post('/', auth, async (req, res) => {
  try {
    const invoice = new Invoice({ ...req.body, studioId: req.studioId });
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update invoice
router.put('/:id', auth, async (req, res) => {
  try {
    const invoice = await secureFindOne(Invoice, { _id: req.params.id }, req);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    // Assign fields
    Object.assign(invoice, req.body);
    
    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH update status only
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await secureFindOne(Invoice, { _id: req.params.id }, req);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    invoice.status = status;
    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE invoice
router.delete('/:id', auth, async (req, res) => {
  try {
    await Invoice.findOneAndDelete({ _id: req.params.id, studioId: req.studioId });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
