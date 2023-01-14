import { equal } from "./utils/equal"
import { Card, CARD_COLORS } from "./Card"
import { Cards } from "./Cards"
import { LineId } from "./Line"
import { Player, Game } from "./Game"
import { isBetween } from "./utils/isBetween"

export const COMBOS = [
  "single",
  "consecutive",
  "sameColor",
  "sameNumber",
  "sameColorConsecutive",
] as const
export type Combo = (typeof COMBOS)[number]

/**
 * Cards 的子类，表示游戏中一条战线上某方的卡组合
 *
 * @class CardGroup
 * @typedef {CardGroup}
 * @extends {Cards}
 */
export class CardGroup extends Cards {
  player: Player
  lineId: LineId
  game: Game
  combo: Combo = "single"

  /** 组成为三张的轮数。未完成则为Infinity  */
  completeWhen = Infinity

  /**
   * CardGroup Constructor
   *
   * @throws EXCEED_CARD_LIMIT
   * @returns {*}
   */
  constructor(
    game: Game,
    lineId: LineId,
    player: Player,
    cards: Card[] = [],
    completeWhen = Infinity
  ) {
    super(...cards)
    if (this.length > 3) {
      throw new Error("EXCEED_CARD_LIMIT")
    }
    this.game = game
    this.lineId = lineId
    this.player = player
    this.checkCombo()
    this.completeWhen = completeWhen
  }

  /**
   * @param {Card} card
   * @returns {this}
   * @throws EXCEED_CARD_LIMIT
   */
  addCard(card: Card): this {
    if (this.length < 3) {
      this.push(card)
      if (this.length == 3) {
        this.completeWhen = this.game.round
      }
      this.checkCombo()
      return this
    } else {
      throw new Error("EXCEED_CARD_LIMIT")
    }
  }

  /**
   * 检查combo。
   *
   * @returns {Combo}
   */
  checkCombo(): Combo {
    this.combo = "single"
    if (this.length == 3) {
      const sorted = this.generateSorted()
      if (
        sorted[0].number + 1 == sorted[1].number &&
        sorted[1].number + 1 == sorted[2].number
      ) {
        this.combo = "consecutive"
      }
      if (equal(...sorted.map((c) => c.color))) {
        if (this.combo == "consecutive") {
          this.combo = "sameColorConsecutive"
        } else {
          this.combo = "sameColor"
        }
      }
      if (equal(...sorted.map((c) => c.number))) {
        this.combo = "sameNumber"
      }
    }
    return this.combo
  }

  /**
   * 生成最佳情况下的牌组
   * @param {CardGroup} targetCards 目标卡组（在本卡组为空时使用）
   * @returns {CardGroup|false} 最佳情况下的牌组，凑不齐三张会返回false
   */

  generateBestCase(
    targetCards: CardGroup = new CardGroup(this.game, 0, "p1")
  ): CardGroup | false {
    const availableCards = new Cards(
      ...this.game.deck,
      ...this.game.hands.p1,
      ...this.game.hands.p2
    )

    /** 作为对比基准的卡 */
    const baseCard: Card | undefined = this?.[0]
    const createSimilarCardGroup = (cards: Card[]) => {
      return new CardGroup(this.game, this.lineId, this.player, cards)
    }

    if (baseCard) {
      /** 同花卡数组。若为False代表不可能 */
      let sameColorCards: Cards | false = new Cards(baseCard)

      /** 同数字卡数组。若为False代表不可能 */
      let sameNumberCards: Cards | false = new Cards(baseCard)

      /** 顺子数组。若为False代表不可能 */
      let consecutiveCards: Cards | false = new Cards(baseCard)

      /** 同花顺数组。若为False代表不可能 */
      let sameColorConsecutiveCards: Cards | false = new Cards(baseCard)

      /** 最大单牌数组。 */
      const singleCards: Card[] | false =
        availableCards.length >= 3 - this.length
          ? [...availableCards.selectMaxN(3 - this.length), ...this]
          : false

      // 根据已有的卡牌数量，设定 Combo 的初始值
      switch (this.length) {
        case 1:
          break
        case 2:
          if (this[0].color === this[1].color) {
            sameColorCards.push(this[1])
          } else {
            sameColorCards = false
          }

          if (this[0].number === this[1].number) {
            sameNumberCards.push(this[1])
          } else {
            sameNumberCards = false
          }

          if (isBetween(Math.abs(this[0].number - this[1].number), 1, 2)) {
            consecutiveCards.push(this[1])
          } else {
            consecutiveCards = false
          }
          if (consecutiveCards && sameColorCards) {
            sameColorConsecutiveCards.push(this[1])
          } else {
            sameColorConsecutiveCards = false
          }
          break
        case 3:
          return this
          break
      }

      // 统计每种 combo
      availableCards.forEach((c) => {
        if (sameColorCards !== false) {
          c.color == baseCard.color && sameColorCards.push(c)
        }
        if (sameNumberCards !== false) {
          c.number == baseCard.number && sameNumberCards.push(c)
        }
        if (consecutiveCards !== false) {
          if (isBetween(Math.abs(c.number - baseCard.number), 1, 2)) {
            if (
              this?.[1] &&
              isBetween(Math.abs(c.number - this[1].number), 1, 2)
            ) {
              if (!consecutiveCards.find((i) => i.number === c.number)) {
                consecutiveCards.push(c)
              }
              if (
                sameColorConsecutiveCards !== false &&
                c.color === baseCard.color
              ) {
                sameColorConsecutiveCards.push(c)
              }
            }
          }
        }
      })
      if (sameColorConsecutiveCards && sameColorConsecutiveCards.length >= 3) {
        const result = sameColorConsecutiveCards.isConsecutive()
        if (result) {
          return createSimilarCardGroup(result)
        }
      }
      if (sameNumberCards && sameNumberCards.length >= 3) {
        return createSimilarCardGroup([
          ...new Cards(...sameNumberCards.slice(this.length - 1)).selectMaxN(
            3 - this.length
          ),
          ...this,
        ])
      }
      if (sameColorCards && sameColorCards.length >= 3) {
        return createSimilarCardGroup([
          ...new Cards(...sameColorCards.slice(this.length - 1)).selectMaxN(
            3 - this.length
          ),
          ...this,
        ])
      }
      if (consecutiveCards && consecutiveCards.length >= 3) {
        const result = consecutiveCards.isConsecutive()
        if (result) {
          return createSimilarCardGroup(result)
        }
      }
      if (singleCards && singleCards.length == 3) {
        return createSimilarCardGroup(singleCards)
      }
      return false
    } else {
      let winnableCards: Cards | false

      for (
        let i = COMBOS.indexOf(targetCards.combo);
        i < COMBOS.length - 1;
        i++
      ) {
        const targetSum = targetCards.combo == COMBOS[i] ? targetCards.sum() : 0
        switch (COMBOS[i]) {
          case "single":
            winnableCards =
              availableCards.length >= 3 ? availableCards.selectMaxN(3) : false
            if (winnableCards) {
              if (winnableCards.sum() > targetSum) {
                return createSimilarCardGroup(winnableCards)
              }
            }
            break
          case "consecutive":
            {
              winnableCards = availableCards.isConsecutive(3)
              if (winnableCards && winnableCards.sum() > targetSum) {
                return createSimilarCardGroup(winnableCards)
              }
            }
            break
          case "sameColor":
            for (const color of CARD_COLORS) {
              winnableCards = new Cards(
                ...availableCards.filter((c) => c.color === color)
              ).selectMaxN(3)
              if (
                winnableCards.length == 3 &&
                winnableCards.sum() > targetSum
              ) {
                return createSimilarCardGroup(winnableCards)
              }
            }
            break
          case "sameNumber":
            {
              const targetNum = targetCards?.[0]?.number || 0
              for (let number = targetNum + 1; number <= 10; number++) {
                winnableCards = new Cards(
                  ...availableCards.filter((c) => c.number === number)
                )
                if (winnableCards.length >= 3) {
                  return createSimilarCardGroup(winnableCards.slice(0, 3))
                }
              }
            }
            break
          case "sameColorConsecutive":
            for (const color of CARD_COLORS) {
              winnableCards = new Cards(
                ...availableCards.filter((c) => c.color === color)
              ).isConsecutive(3)
              if (winnableCards && winnableCards.sum() > targetSum) {
                return createSimilarCardGroup(winnableCards)
              }
            }
            break
        }
      }
      return false
    }
  }

  /**
   * 与其他卡组比较（两个卡组都需为三张）
   *
   * @param {CardGroup} cardGroup2 被对比的卡组
   * @returns {boolean} true 则 当前卡组较大，false 则 CardGroup2较大（不存在平局）
   * @throws COMPLETE_EQUAL
   * @throws CARD_GROUP_SIZE_NOT_3
   */
  compareWith(cardGroup2: CardGroup): boolean {
    let balance = 0
    if (this.length != 3 || cardGroup2.length != 3) {
      throw new Error("CARD_GROUP_SIZE_NOT_3")
    }

    // 若两边都齐全
    balance = COMBOS.indexOf(this.combo) - COMBOS.indexOf(cardGroup2.combo)
    if (balance === 0) {
      const p1Sum = this.sum()
      const p2Sum = cardGroup2.sum()
      balance = p1Sum - p2Sum
    }
    if (balance === 0) {
      balance = cardGroup2.completeWhen - this.completeWhen
    }
    if (balance === 0) {
      throw new Error("ERROR_COMPLETE_EQUAL")
    }

    return balance > 0
  }
}
