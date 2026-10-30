import { serviceOptions } from '../data/services';

export interface Inquiry {
  firstName: string; lastName: string; email: string; phone: string;
  service: string; message: string;
}
export type InquiryErrors = Partial<Record<keyof Inquiry, string>>;
export const fields = ['firstName', 'lastName', 'email', 'phone', 'service', 'message'] as const;
export const failureMessage = 'We couldn’t send your inquiry. Please try again or call 714-534-0070.';
export const successMessage = 'Thank you. Your inquiry has been received.';

export function validateInquiry(input: unknown): { data: Inquiry; errors: InquiryErrors; valid: boolean } {
  const record = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const data = Object.fromEntries(fields.map(key => [key, typeof record[key] === 'string' ? record[key].trim() : ''])) as unknown as Inquiry;
  const errors: InquiryErrors = {};
  if (!data.firstName) errors.firstName = 'Enter your first name.';
  else if (data.firstName.length > 100 || /[\r\n]/.test(data.firstName)) errors.firstName = 'Use a first name of 100 characters or fewer.';
  if (data.lastName.length > 100 || /[\r\n]/.test(data.lastName)) errors.lastName = 'Use a last name of 100 characters or fewer.';
  if (!data.email || data.email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email)) errors.email = 'Enter a valid email address.';
  if (data.phone && (data.phone.length > 40 || !/^[+\d\s().-]{7,40}$/.test(data.phone))) errors.phone = 'Enter a valid phone number or leave this field blank.';
  if (!serviceOptions.some(s => s.value === data.service)) errors.service = 'Choose a service.';
  if (!data.message) errors.message = 'Enter a message.';
  else if (data.message.length > 2000) errors.message = 'Use 2,000 characters or fewer.';
  return { data, errors, valid: Object.keys(errors).length === 0 };
}
