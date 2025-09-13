/**
 * Utility functions for safe object property access to prevent crashes when API returns null/undefined
 */

/**
 * Safely gets a nested property with optional fallback
 */
export const safeGet = <T>(
  obj: any,
  path: string,
  fallback?: T
): T | undefined => {
  if (!obj || typeof obj !== 'object') {
    return fallback;
  }

  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result == null || typeof result !== 'object' || !(key in result)) {
      return fallback;
    }
    result = result[key];
  }

  return result !== undefined ? result : fallback;
};

/**
 * Safely gets a number value with fallback
 */
export const safeNumber = (value: unknown, fallback: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

/**
 * Safely gets a string value with fallback
 */
export const safeString = (value: unknown, fallback: string = ''): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (value != null && typeof value === 'object' && 'toString' in value) {
    try {
      return String(value);
    } catch {
      return fallback;
    }
  }
  if (value != null) {
    return String(value);
  }
  return fallback;
};

/**
 * Safely gets a boolean value with fallback
 */
export const safeBool = (value: unknown, fallback: boolean = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return fallback;
};

/**
 * Safely checks if a value exists and is not null/undefined
 */
export const exists = (value: unknown): value is NonNullable<unknown> => {
  return value !== null && value !== undefined;
};

/**
 * Safely merges objects without overwriting with null/undefined values
 */
export const safeMerge = <T extends object>(target: T, ...sources: Partial<T>[]): T => {
  const result = { ...target };

  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;

    for (const key in source) {
      const value = source[key];
      if (exists(value)) {
        result[key] = value as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
};

/**
 * Safely converts unknown data to expected type with validation
 */
export const safeConvert = <T>(
  value: unknown,
  validator: (v: unknown) => v is T,
  fallback: T
): T => {
  if (validator(value)) {
    return value;
  }
  return fallback;
};