/**
 * 判断数字是否在下限上限之间（含上下限）
 *
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export function isBetween(num: number, min: number, max: number): boolean {
  return num >= min && num <= max
}
