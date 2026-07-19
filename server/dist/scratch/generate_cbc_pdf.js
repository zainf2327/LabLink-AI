import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Construct a valid minimal PDF containing structured CBC diagnostic test parameters
const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [ 0 0 612 792 ] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 600 >>
stream
BT
/F1 16 Tf
72 720 Td
(LabLink AI Diagnostic Lab Services) Tj
/F1 12 Tf
0 -30 Td
(Patient Name: John Doe) Tj
0 -18 Td
(Accession Number: CBC-982312) Tj
0 -18 Td
(Date: July 17, 2026) Tj
0 -40 Td
(TEST PARAMETER       | RESULT       | REFERENCE RANGE    | STATUS) Tj
0 -18 Td
(--------------------------------------------------------------------) Tj
0 -18 Td
(White Blood Cells    | 6.8 x10^9/L  | 4.0 - 11.0 x10^9/L | Normal) Tj
0 -18 Td
(Red Blood Cells      | 4.9 x10^12/L | 4.5 - 5.9 x10^12/L | Normal) Tj
0 -18 Td
(Hemoglobin           | 15.4 g/dL    | 13.5 - 17.5 g/dL   | Normal) Tj
0 -18 Td
(Hematocrit           | 45.2 %       | 41.0 - 50.0 %      | Normal) Tj
0 -18 Td
(Platelets            | 245 x10^9/L  | 150 - 450 x10^9/L  | Normal) Tj
0 -40 Td
(Notes: All cell lines show normal cellular morphology and counts.) Tj
0 -30 Td
(Medical Disclaimer: For testing and educational demonstration purposes only.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000059 00000 n 
0000000117 00000 n 
0000000244 00000 n 
0000000311 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
960
%%EOF`;
const outputPath = path.resolve(__dirname, '../../../CBC_Test_Report.pdf');
fs.writeFileSync(outputPath, pdfContent);
console.log(`PDF Report generated successfully at: ${outputPath}`);
process.exit(0);
