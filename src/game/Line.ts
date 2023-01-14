import { Game, Player, getOpponent } from "./Game"
import { CardGroup } from "./CardGroup"

export const LINE_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const
export const LINE_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"]
export type LineId = (typeof LINE_IDS)[number]
export function isLineId(l: number): l is LineId {
  return LINE_IDS.includes(l as LineId)
}
/**
 * 游戏中的一条战线
 *
 * @class Line
 * @typedef {Line}
 */
export class Line {
  id: LineId
  game: Game
  cards: { p1: CardGroup; p2: CardGroup }
  winner: Player | false = false

  constructor(
    game: Game,
    id: LineId,
    p1Cards?: CardGroup,
    p2Cards?: CardGroup
  ) {
    this.id = id
    this.game = game
    this.cards = {
      p1: p1Cards || new CardGroup(game, id, "p1"),
      p2: p2Cards || new CardGroup(game, id, "p2"),
    }
  }

  /**
   * 确认本条战线的输赢。发起方必须满三张。对手可以不齐全。
   *
   * @param {Player} player
   * @returns {boolean} 返回是否成功占领
   * @throws LESS_THAN_3
   */
  settle(player: Player): boolean {
    const opponent = getOpponent(player)
    if (this.cards[player].length < 3) {
      throw new Error("LESS_THAN_3")
    }
    const opponentBestCase = this.cards[opponent].generateBestCase(
      this.cards[player]
    )
    this.winner =
      !opponentBestCase || this.cards[player].compareWith(opponentBestCase)
        ? player
        : false
    return this.winner !== false
  }
}
