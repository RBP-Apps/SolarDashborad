// Phone numbers in the whole system are exactly 10 digits.
export const PHONE_LENGTH = 10;

// What is typed or pasted becomes digits only, at most 10 of them
export const cleanPhone = (value) => String(value ?? '').replace(/\D/g, '').slice(0, PHONE_LENGTH);

// An empty phone is allowed here (required fields are checked separately); otherwise it must be exactly 10 digits
export const isValidPhone = (value) => {
  const v = String(value ?? '').trim();
  return v === '' || /^\d{10}$/.test(v);
};

export const PHONE_ERROR = 'Phone number must be exactly 10 digits';
