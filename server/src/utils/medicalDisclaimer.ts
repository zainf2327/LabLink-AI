export const MEDICAL_DISCLAIMER = [
  'Medical disclaimer: For educational context only. Not a substitute for professional clinical advice.',
  'Please consult a doctor before making medical decisions.',
].join(' ');

export const appendMedicalDisclaimer = (content: string): string => {
  const trimmed = content.trim();
  return `${trimmed}\n\n---\n${MEDICAL_DISCLAIMER}`;
};
