import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export const pdfExtractService = {
  async extractText(pdfBuffer: Buffer): Promise<string> {
    try {
      const parser = new pdf.PDFParse({ data: new Uint8Array(pdfBuffer) });
      const data = await parser.getText();
      return data.text || '';
    } catch (err: any) {
      console.error('Error extracting text from PDF:', err);
      throw new Error('Failed to parse PDF document: ' + err.message);
    }
  }
};
