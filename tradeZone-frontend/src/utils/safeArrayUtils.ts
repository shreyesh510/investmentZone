/**
 * Utility functions for safe array operations to prevent crashes when API returns null/undefined
 */

/**
 * Safely ensures a value is an array
 */
export const safeArray = <T>(value: T[] | null | undefined): T[] => {
  return Array.isArray(value) ? value : [];
};

/**
 * Safely gets array length
 */
export const safeLength = (array: unknown[] | null | undefined): number => {
  return Array.isArray(array) ? array.length : 0;
};

/**
 * Safely maps over an array
 */
export const safeMap = <T, U>(
  array: T[] | null | undefined,
  callback: (item: T, index: number, array: T[]) => U
): U[] => {
  return Array.isArray(array) ? array.map(callback) : [];
};

/**
 * Safely filters an array
 */
export const safeFilter = <T>(
  array: T[] | null | undefined,
  predicate: (item: T, index: number, array: T[]) => boolean
): T[] => {
  return Array.isArray(array) ? array.filter(predicate) : [];
};

/**
 * Safely reduces an array
 */
export const safeReduce = <T, U>(
  array: T[] | null | undefined,
  callback: (accumulator: U, currentValue: T, currentIndex: number, array: T[]) => U,
  initialValue: U
): U => {
  return Array.isArray(array) ? array.reduce(callback, initialValue) : initialValue;
};

/**
 * Safely finds an item in an array
 */
export const safeFind = <T>(
  array: T[] | null | undefined,
  predicate: (item: T, index: number, array: T[]) => boolean
): T | undefined => {
  return Array.isArray(array) ? array.find(predicate) : undefined;
};

/**
 * Safely gets an array slice
 */
export const safeSlice = <T>(
  array: T[] | null | undefined,
  start?: number,
  end?: number
): T[] => {
  return Array.isArray(array) ? array.slice(start, end) : [];
};

/**
 * Safely checks if every element passes a test
 */
export const safeEvery = <T>(
  array: T[] | null | undefined,
  predicate: (item: T, index: number, array: T[]) => boolean
): boolean => {
  return Array.isArray(array) ? array.every(predicate) : true;
};

/**
 * Safely checks if some elements pass a test
 */
export const safeSome = <T>(
  array: T[] | null | undefined,
  predicate: (item: T, index: number, array: T[]) => boolean
): boolean => {
  return Array.isArray(array) ? array.some(predicate) : false;
};