/**
 * 判断一个数组内的元素是否全部相等
 *
 * @template T
 * @param {...Array<T>} items
 * @returns {boolean}
 */
export function equal<T>(...items: Array<T>): boolean {
  return items.reduce(
    (acc: boolean, cur: T, i: number) =>
      acc && (i == 0 || cur === items[i - 1]),
    true
  )
}
