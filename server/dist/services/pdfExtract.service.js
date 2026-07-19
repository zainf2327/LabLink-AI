import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
export const pdfExtractService = {
    async extractText(pdfBuffer) {
        try {
            const parser = new pdf.PDFParse({ data: new Uint8Array(pdfBuffer) });
            const data = await parser.getText();
            return data.text || '';
        }
        catch (err) {
            console.error('Error extracting text from PDF:', err);
            throw new Error('Failed to parse PDF document: ' + err.message);
        }
    }
};
