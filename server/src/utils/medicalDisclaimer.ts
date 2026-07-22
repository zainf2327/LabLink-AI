export const MEDICAL_DISCLAIMER = [
  'Medical disclaimer: LabLink AI can help explain report information and highlight patterns for educational context only.',
  'It does not provide a diagnosis, treatment plan, or emergency guidance, and it is not a substitute for advice from a licensed clinician.',
  'Please review your results with your doctor or qualified healthcare professional before making medical decisions.',
].join(' ');

export const appendMedicalDisclaimer = (content: string): string => {
  const trimmed = content.trim();
  return `${trimmed}\n\n---\n${MEDICAL_DISCLAIMER}`;
};
