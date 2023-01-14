import * as readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
export const rl = readline.createInterface({ input, output })
export const question = rl.question
export async function readObject<T>(ref: T): Promise<T> {
  const o = { ...ref }
  for (const key in ref) {
    const input = await rl.question(`${key}:`)
    switch (typeof ref[key]) {
      case "boolean":
        // <boolean>(<unknown>o[key]);
        o[key] = (input === "true") as never
        break
      case "number":
        o[key] = Number(input) as never
        break
      case "string":
        o[key] = input as never
        break
    }
    if (input === "false") {
      o[key] = false as never
    }
  }
  return o
}
