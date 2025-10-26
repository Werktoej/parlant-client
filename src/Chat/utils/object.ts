/**
 * Groups an array of objects by a key function
 * @param array - The array to group
 * @param keyFn - Function that returns the key for grouping
 * @returns Object with keys as group identifiers and values as arrays of grouped items
 */

import { logWarn } from './logger';
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    try {
      const key = keyFn(item);
      if (key !== undefined && key !== null) {
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      }
    } catch (error) {
      logWarn('Error in groupBy keyFn:', error, 'for item:', item);
    }
    return groups;
  }, {} as Record<K, T[]>);
}
