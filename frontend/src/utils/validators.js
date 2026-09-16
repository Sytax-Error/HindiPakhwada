export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOBILE_PATTERN = /^[6-9]\d{9}$/;
export const EMPLOYEE_CODE_PATTERN = /^\d{6}$/;

export function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}
