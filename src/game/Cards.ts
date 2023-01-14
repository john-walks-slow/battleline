import { Card, CARD_COLORS, CARD_NUMBERS } from "./Card"

/**
 * 卡的集合，在 Array<Card> 基础上扩展了方法
 *
 * @class Cards
 * @typedef {Cards}
 * @extends {Array<Card>}
 */
export class Cards extends Array<Card> {
  /**
   * 根据数字及花色从小到大排序（in place）
   *
   * @returns {this}
   */
  sortCards(): this {
    return this.sort(
      (a, b) =>
        CARD_NUMBERS.indexOf(a.number) * 10 +
        CARD_COLORS.indexOf(a.color) -
        CARD_NUMBERS.indexOf(b.number) * 10 +
        CARD_COLORS.indexOf(b.color)
    )
  }

  /**
   * 生成一个排序过的卡牌数组 (NOT in place)
   *
   * @returns {Cards}
   */
  generateSorted(): Cards {
    return new Cards(...this).sortCards()
  }

  /**
   * 洗牌（in place）
   *
   * @returns {this}
   */
  shuffle(): this {
    let currentIndex = this.length,
      randomIndex
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex--

      // And swap it with the current element.
      ;[this[currentIndex], this[randomIndex]] = [
        this[randomIndex],
        this[currentIndex],
      ]
    }
    return this
  }

  /**
   * 判断是否存在n张连续的牌。
   *
   * @param {number} [n=3]
   * @returns {Cards|false} 若存在，返回最大的一组符合的牌，否则返回 false
   */
  isConsecutive(n = 3): Cards | false {
    const filtered = new Cards(...this)
      .sortCards()
      .filter((v, i, a) => v !== a?.[i - 1])
    let bestEndIndex = -1
    filtered.reduce((acc, cur, i) => {
      if (i == 0) {
        return 1
      }
      if (cur.number == filtered[i - 1].number + 1) {
        acc += 1
        if (acc >= n) {
          bestEndIndex = i
        }
        return acc
      } else {
        return 1
      }
    }, 1)
    return bestEndIndex != -1
      ? new Cards(...filtered.slice(bestEndIndex - n + 1, bestEndIndex + 1))
      : false
  }

  /**
   * 求和
   *
   * @returns {number}
   */
  sum(): number {
    return this.reduce((acc, cur) => acc + cur.number, 0)
  }

  /**
   * 选取n张最大的牌。不足n时返回本数组。（NOT in place）
   *
   * @param {number} [n=3]
   * @returns {Card[]}
   * @throws BAD_INPUT
   */
  selectMaxN(n = 3): Cards {
    if (n == 0) {
      return new Cards()
    }
    if (n > this.length) {
      return this
    }
    if (n < 0) {
      throw new Error("BAD_INPUT")
    }
    return new Cards(...this.generateSorted().slice(-n))
  }

  toString(invisible = false): string {
    return this.map((c) => c.toString(invisible)).join("|")
  }
}
