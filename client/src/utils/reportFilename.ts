export interface ReportFilenameInput {
  patientName?: string;
  testNames?: string[];
  createdAt: string | Date;
  versionSuffix?: string;
}

export function buildReportFilename(
  report: ReportFilenameInput,
  options: { includePatientName: boolean } = { includePatientName: true }
): string {
  const orgPrefix = 'LabLink';
  const docType = 'Report';
  
  let patientNamePart = '';
  if (options.includePatientName && report.patientName) {
    patientNamePart = report.patientName
      .trim()
      .normalize('NFD') // decompose combined graphemes to strip non-ASCII accents
      .replace(/[\u0300-\u036f]/g, '') // remove accent marks
      .replace(/[^a-zA-Z0-9]/g, '_') // replace non-alphanumeric characters with underscores
      .replace(/__+/g, '_') // collapse multiple underscores
      .replace(/^_+|_+$/g, ''); // trim leading/trailing underscores
  }

  let testsPart = 'Diagnostic';
  if (report.testNames && report.testNames.length > 0) {
    const list = report.testNames.map(t =>
      t.trim()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '')
       .replace(/[^a-zA-Z0-9]/g, '_')
       .replace(/__+/g, '_')
       .replace(/^_+|_+$/g, '')
    ).filter(Boolean);

    if (list.length > 0) {
      if (list.length <= 3) {
        testsPart = list.join('_');
      } else {
        testsPart = `${list.slice(0, 3).join('_')}_and_${list.length - 3}_more`;
      }
    }
  }

  const date = new Date(report.createdAt);
  const dateStr = isNaN(date.getTime())
    ? new Date().toISOString().split('T')[0]
    : date.toISOString().split('T')[0];

  let filename = `${orgPrefix}_${docType}`;
  if (patientNamePart) {
    filename += `_${patientNamePart}`;
  }
  filename += `_${testsPart}_${dateStr}`;

  if (report.versionSuffix) {
    const suffix = report.versionSuffix
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .replace(/__+/g, '_')
      .replace(/^_+|_+$/g, '');
    
    if (suffix) {
      filename += suffix.startsWith('_') ? suffix : `_${suffix}`;
    }
  }

  return `${filename}.pdf`;
}
