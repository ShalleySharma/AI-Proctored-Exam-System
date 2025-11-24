import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

export const generateResultPDFfromHTML = async (sessionId, htmlUrl) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  try {
    // Navigate to the HTML page (could be a local file path or hosted URL)
    await page.goto(htmlUrl, { waitUntil: 'networkidle0' });

    // Optional: you can manipulate the page DOM here if needed before PDF

    const pdfPath = path.join('uploads', `result_${sessionId}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
    });

    await browser.close();
    return pdfPath;
  } catch (error) {
    await browser.close();
    throw error;
  }
};
