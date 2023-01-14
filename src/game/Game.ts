import chalk from "chalk"
import { Card, CARD_NUMBERS, CARD_COLORS } from "./Card"
import { Cards } from "./Cards"
import { LineId, Line, LINE_IDS, LINE_NAMES } from "./Line"
import { CardGroup } from "./CardGroup"

const PLAYERS = ["p1", "p2"] as const
export type Player = (typeof PLAYERS)[number]
export function isPlayer(p: Player): p is Player {
  return PLAYERS.includes(p)
}
const STAGES = ["play", "settle", "get"] as const
export type Stage = (typeof STAGES)[number]
/**
 * 获取该玩家的对手玩家
 * @param player 当前玩家
 * @returns 对手玩家
 */
export const getOpponent = (player: Player): Player =>
  player == "p1" ? "p2" : "p1"

const createDeck = () =>
  new Cards(
    ...CARD_COLORS.map((c) => CARD_NUMBERS.map((n) => new Card(c, n))).flat()
  )

export type MoveBase = {
  player: Player
  stage: Stage
}

export type PlayMove = MoveBase & {
  stage: "play"
  /** false 表示放弃（在没有地方可以放牌的情况下） */
  lineId: LineId | false
  cardIndex: number | false
}
export type GetMove = MoveBase & { stage: "get" }
export type SettleMove = MoveBase & {
  stage: "settle"
  settleLineIds: LineId[] | false
}
export type Move = PlayMove | GetMove | SettleMove

export interface GameData {
  round?: number
  deck?: Cards
  hands?: { p1: Cards; p2: Cards }
  lines?: Line[]
  playing?: Player
  stage?: Stage
  winner?: Player
}
export class Game implements GameData {
  round = 0
  deck: Cards = createDeck()
  hands: { p1: Cards; p2: Cards } = { p1: new Cards(), p2: new Cards() }
  lines: Line[] = LINE_IDS.map((i) => new Line(this, i))
  playing: Player = "p1"
  stage: Stage = "play"
  winner: Player | undefined = undefined
  constructor(data?: GameData) {
    data && Object.assign(this, data)
  }
  update(data: GameData) {
    Object.assign(this, data)
  }
  init() {
    this.deck.shuffle()
    if (Math.random() > 0.5) {
      this.playing = "p1"
    } else {
      this.playing = "p2"
    }
    ;[...Array(7)].forEach(() => {
      this.getCard(this.playing)
      this.getCard(getOpponent(this.playing))
    })
  }
  nextPlayer() {
    if (!this.playing) {
      this.playing = "p1"
    } else {
      this.playing = getOpponent(this.playing)
    }
    this.stage = "play"
  }

  /**
   * 进行一次动作。
   *
   * @param {Move} move
   * @returns {(GameData | Error)} 不返回/返回错误信息：Game End | Wrong Stage | Wrong Player | Invalid Move
   */
  makeMove(move: Move): GameData | Error {
    if (this.winner) {
      return new Error("Game End")
    }
    if (this.playing !== move.player) {
      return new Error("Wrong Player")
    }
    if (this.stage !== move.stage) {
      return new Error("Wrong Stage")
    }
    let result: GameData | Error | undefined
    switch (move.stage) {
      case "play":
        if (move.lineId !== false && move.cardIndex !== false) {
          result = this.playCard(move.player, move.lineId, move.cardIndex)
          if (result instanceof Error) return result
        } else {
          if (
            this.hands[move.player].length > 0 &&
            this.lines.find((l) => l.cards[move.player].length < 3) !==
              undefined
          ) {
            return new Error("CAN_NOT_GIVE_UP")
          }
        }
        this.round++
        this.stage = "settle"
        break
      case "settle":
        if (move.settleLineIds) {
          result = this.settleLines(move.player, move.settleLineIds)
          if (result instanceof Error) return result
        }
        if (this.deck.length > 0) {
          this.stage = "get"
        } else {
          this.nextPlayer()
        }
        break
      case "get":
        result = this.getCard(move.player)
        if (result instanceof Error) return result
        this.nextPlayer()
    }

    if (result instanceof Error) {
      throw result
    }
    return {
      ...result,
      stage: this.stage,
      round: this.round,
      playing: this.playing,
      ...this.settleGame(),
    }
  }

  toString(player: Player = "p1", showOpponent = false): string {
    const opponent = getOpponent(player)
    const output =
      (this.winner
        ? `${this.winner} Wins!\n`
        : `Playing: ${this.playing}  Deck: ${this.deck.length}  Round: ${this.round}\n`) +
      this.hands[opponent].toString(!showOpponent) +
      "\n-" +
      LINE_IDS.map(() => "-").join("--") +
      "-\n" +
      this.lines
        .map((l) => l.cards[opponent]?.[2]?.toString() || "   ")
        .join("") +
      "\n" +
      this.lines
        .map((l) => l.cards[opponent]?.[1]?.toString() || "   ")
        .join("") +
      "\n" +
      this.lines
        .map((l) => l.cards[opponent]?.[0]?.toString() || "   ")
        .join("") +
      "\n" +
      LINE_IDS.map((i) => {
        type BgColors = "bgGrey" | "bgGreen" | "bgRed"
        let bgColor: BgColors = "bgGrey"
        this.lines[i].winner == "p1" && (bgColor = "bgGreen")
        this.lines[i].winner == "p2" && (bgColor = "bgRed")
        return chalk[bgColor](` ${LINE_NAMES[i]} `)
      }).join("") +
      "\n" +
      this.lines
        .map((l) => l.cards[player]?.[0]?.toString() || "   ")
        .join("") +
      "\n" +
      this.lines
        .map((l) => l.cards[player]?.[1]?.toString() || "   ")
        .join("") +
      "\n" +
      this.lines
        .map((l) => l.cards[player]?.[2]?.toString() || "   ")
        .join("") +
      "\n-" +
      LINE_IDS.map(() => "-").join("--") +
      "-\n" +
      this.hands[player].toString()
    // "  I  II III  IV   V  VI VII";
    return output
  }

  /**
   * 某玩家从牌堆中摸一张牌。
   *
   * @param {Player} player
   * @returns {(Card | null)} 返回摸到的牌。没牌了就返回null
   */
  getCard(player: Player): GameData {
    if (this.deck.length > 0) {
      const newCard = this.deck.shift() as Card
      this.hands[player].push(newCard)
      return { hands: this.hands }
    } else {
      return {}
    }
  }

  /**
   * 操作某玩家在某一列出一张手牌，并给那一列排序。需保证该列不到三张牌。
   *
   * @param {Player} player
   * @param {LineId} lineId
   * @param {number} cardIndex
   * @returns {GameData|Error} 完成的卡组或错误信息
   */

  playCard(
    player: Player,
    lineId: LineId,
    cardIndex: number
  ): GameData | Error {
    if (this.lines[lineId].cards[player].length >= 3) {
      return new Error("EXCEED_CARD_LIMIT")
    }
    if (this.lines[lineId].winner !== false) {
      return new Error("ALREADY_SETTLED")
    }
    if (this.hands[player].length < cardIndex + 1 || cardIndex < 0) {
      return new Error("BAD_CARD_INDEX")
    }
    this.lines[lineId].cards[player].addCard(
      this.hands[player].splice(cardIndex, 1)[0]
    )
    this.lines[lineId].cards[player].sortCards()
    // if (
    //   this.lines[lineId].cards.p1.length === 3 &&
    //   this.lines[lineId].cards.p2.length === 3
    // ) {
    //   this.lines[lineId].winner = this.lines[lineId].cards.p1.compareWith(
    //     this.lines[lineId].cards.p2
    //   )
    //     ? "p1"
    //     : "p2"
    // }
    return { hands: this.hands, lines: this.lines }
  }

  settleLines(player: Player, lineIds: LineId[]): GameData | Error {
    if (
      lineIds.find((l) => this.lines[l].cards[player].length !== 3) !==
      undefined
    ) {
      return new Error("ONE_LINE_NOT_COMPLETE")
    }
    if (lineIds.find((l) => this.lines[l].winner !== false) !== undefined) {
      return new Error("ONE_LINE_ALREADY_SETTLED")
    }
    const succeedLines = lineIds.filter((l) => this.lines[l].settle(player))
    return succeedLines.length > 0 ? { lines: this.lines } : {}
  }
  /**
   * 根据战线情况，确认输赢。
   * @returns
   * @throws  WIN_SIMULTANEOUSLY
   *
   */
  settleGame(): GameData {
    const settledLines = {
      p1: this.lines.filter((l) => l.winner == "p1"),
      p2: this.lines.filter((l) => l.winner == "p2"),
    }
    const isConsecutiveWin = { p1: false, p2: false }
    const isCountWin = { p1: false, p2: false }
    PLAYERS.forEach((p) => {
      isConsecutiveWin[p] = settledLines[p].reduce(
        (acc: boolean, cur: Line, i) =>
          acc ||
          (cur.id + 1 === settledLines[p]?.[i + 1]?.id &&
            cur.id + 2 === settledLines[p]?.[i + 2]?.id),
        false
      )
      isCountWin[p] = settledLines[p].length >= 5
    })
    if (isConsecutiveWin.p1 || isCountWin.p1) {
      this.winner = "p1"
    }
    if (isConsecutiveWin.p2 || isCountWin.p2) {
      if (this.winner == "p1") {
        throw new Error(" WIN_SIMULTANEOUSLY")
      }
      this.winner = "p2"
    }
    return this.winner ? { winner: this.winner } : {}
  }
}
