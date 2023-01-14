import chalk from "chalk"

export const CARD_COLORS = [
  "blue",
  "green",
  "red",
  "yellow",
  "magenta",
  "grey",
] as const
export type CardColor = (typeof CARD_COLORS)[number]
export const CARD_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
export type CardNumber = (typeof CARD_NUMBERS)[number]

export class Card {
  color: CardColor
  number: CardNumber
  constructor(color: CardColor, number: CardNumber) {
    this.color = color
    this.number = number
  }
  toString(invisible = false): string {
    if (invisible) {
      return chalk.grey(" * ")
    }
    return chalk[this.color](this.number.toString().padStart(2) + " ")
  }
}
