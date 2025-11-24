import dotenv from 'dotenv';
dotenv.config();

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

export const generateResultPDFWithUI = async (sessionId) => {
  if (!process.env.FRONTEND_URL) {
    throw new Error('Environment variable FRONTEND_URL is not set.');
  }
  const FRONTEND_URL = process.env.FRONTEND_URL;
  const url = `${FRONTEND_URL}/result/${sessionId}`; // Assuming React app serves ResultPDF page at /result/:sessionId
  const pdfDir = path.resolve('uploads');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  const pdfPath = path.join(pdfDir, `result_ui_${sessionId}.pdf`);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Wait for main container to appear (adjust selector as needed)
    await page.waitForSelector('.container');

    // Wait for all screenshot images to load with naturalWidth > 0
    await page.waitForFunction(() => {
      const imgs = Array.from(document.images);
      return imgs.every(img => img.complete && img.naturalWidth > 0);
    }, { timeout: 10000 });

    // Additional small delay to ensure stability
    await page.waitForTimeout(500);

    // Generate PDF with options to preserve layout and styling
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
  } finally {
    await browser.close();
  }

  return pdfPath;
};
