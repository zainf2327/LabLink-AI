import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

console.log('Type of pdf:', typeof pdf);
console.log('Keys of pdf:', Object.keys(pdf));
console.log('Stringified pdf:', pdf.toString());
const dummyPdfBytes = Buffer.from(
  '%PDF-1.4\n' +
  '1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n' +
  '2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n' +
  '3 0 obj <</Type /Page /Parent 2 0 R /Resources <<>> /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj\n' +
  '4 0 obj <</Length 44>> stream\n' +
  'BT\n' +
  '/F1 12 Tf\n' +
  '72 712 Td\n' +
  '(Patient Hematology Results: normal cell counts.) Tj\n' +
  'ET\n' +
  'endstream\n' +
  'endobj\n' +
  'xref\n' +
  '0 5\n' +
  '0000000000 65535 f\n' +
  '0000000009 00000 n\n' +
  '0000000058 00000 n\n' +
  '0000000115 00000 n\n' +
  '0000000222 00000 n\n' +
  'trailer <</Size 5 /Root 1 0 R>>\n' +
  'startxref\n' +
  '317\n' +
  '%%EOF'
);

const parser = new pdf.PDFParse({ data: new Uint8Array(dummyPdfBytes) });

parser.getText().then((data: any) => {
  console.log('Result text:', data.text);
  process.exit(0);
}).catch((err: any) => {
  console.error('Parsing failed:', err);
  process.exit(1);
});
