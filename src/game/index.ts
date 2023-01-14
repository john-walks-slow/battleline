import { Cards } from "./Cards"
import { Game, GameData } from "./Game"
import { isLineId, LineId, LINE_NAMES } from "./Line"
import { rl } from "./utils/read"
// import * as readline from "node:readline/promises";
// import { stdin as input, stdout as output } from "node:process";
// const rl = readline.createInterface({ input, output });

const server = new Game()
const client = new Game(server)
client.init()
async function round() {
  try {
    if (client.winner) {
      console.log(client.toString())
      return
    }
    let result: GameData | Error | undefined
    if (client.playing == "p1") {
      console.clear()
      console.log(client.toString())
      switch (client.stage) {
        case "play":
          do {
            result instanceof Error && console.log(result)
            result = undefined
            const move = await rl.question("Play: ")
            if (move === "") {
              result = server.makeMove({
                player: client.playing,
                stage: "play",
                lineId: false,
                cardIndex: false,
              })
            } else {
              const lineName = move[0]
              const lineId = LINE_NAMES.indexOf(lineName.toUpperCase())
              if (isLineId(lineId)) {
                const cardIndex = parseInt(move.slice(1)) - 1
                result = server.makeMove({
                  player: client.playing,
                  stage: "play",
                  lineId,
                  cardIndex,
                })
              } else {
                result = new Error("BAD_LINE_ID")
              }
            }
          } while (result instanceof Error)
          break
        case "get":
          // await rl.question("Get...")
          result = server.makeMove({ player: client.playing, stage: "get" })
          break
        case "settle":
          do {
            result instanceof Error && console.log(result)
            result = undefined
            const input = await rl.question("Settle: ")

            let settleLineIds: LineId[] | false
            if (input == "") {
              settleLineIds = false
            } else {
              settleLineIds = input.split(" ").map((l) => {
                const id = LINE_NAMES.indexOf(l.toUpperCase())
                if (isLineId(id)) {
                  return id
                } else {
                  result = new Error("BAD_LINE_ID")
                  return 0
                }
              })
            }
            if (!(<undefined | Error>result instanceof Error)) {
              result = server.makeMove({
                player: client.playing,
                stage: "settle",
                settleLineIds,
              })
            }
          } while (result instanceof Error)
          if (result && result.lines) {
            console.log("Cool!")
            await rl.question("")
          }

          break
      }
    } else {
      switch (client.stage) {
        case "play":
          {
            const available = client.lines
              .filter((l) => l.winner === false && l.cards.p2.length < 3)
              .map((l) => l.id)
            if (available.length === 0 || client.hands.p2.length === 0) {
              result = server.makeMove({
                player: "p2",
                lineId: false,
                cardIndex: false,
                stage: "play",
              })
            } else {
              result = server.makeMove({
                player: "p2",
                lineId: available[Math.floor(Math.random() * available.length)],
                cardIndex: 0,
                stage: "play",
              })
            }
          }
          break
        case "get":
          result = server.makeMove({ player: "p2", stage: "get" })
          break
        case "settle":
          result = server.makeMove({
            player: "p2",
            stage: "settle",
            settleLineIds: false,
          })
          break
      }
    }

    if (!(result instanceof Error) && result) {
      client.update(result)
    }
    await round()
    // this.settleLine;
  } catch (error) {
    console.log(error)
  }
}
round()
// game.round();
// console.dir(game, { depth: null });
// game.playCard("p1", 2, 0);
// game.playCard("p2", 2, 0);
// game.playCard("p1", 2, 0);
// game.playCard("p2", 2, 0);
// game.playCard("p1", 2, 0);
// game.playCard("p2", 2, 0);
// game.settleLine("p2", 2);
// game.playCard("p1", 4, new Card("blue", 3));
// game.playCard("p1", 4, new Card("blue", 3));
// game.playCard("p1", 4, new Card("blue", 3));
// console.log(JSON.stringify(game.lines[2], undefined, 2));

// let line = new Line(
//   new CardGroup(
//     new Card("black", 1),
//     new Card("black", 2),
//     new Card("black", 5)
//   ),
//   new CardGroup(
//     new Card("black", 4),
//     new Card("black", 4),
//     new Card("black", 4)
//   )
// );
// line.compare();
// console.log(line);
