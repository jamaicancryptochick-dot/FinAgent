import { NetworkClient } from './game/NetworkClient.js'
import { MenuScreen } from './screens/MenuScreen.js'
import { LobbyScreen } from './screens/LobbyScreen.js'
import { GameScreen } from './screens/GameScreen.js'

const net = new NetworkClient()
const menu = new MenuScreen(net)
const lobby = new LobbyScreen(net)
const game = new GameScreen(net)

menu.onCreateRoom = (name) => { net.createRoom(name) }
menu.onJoinRoom = (name, code) => { net.joinRoom(name, code) }
menu.onSinglePlayer = (name) => { net.createRoom(name, true) }

net.onRoomUpdate = (data) => {
  menu.hide()
  if (data.singlePlayer) {
    lobby.hide()
    game.start(data)
  } else {
    lobby.show(data)
  }
}

net.onRoomError = (msg) => { menu.showError(msg) }

lobby.onStartGame = (singlePlayer) => { net.startGame(singlePlayer) }
lobby.onLeave = () => {
  net.leaveRoom()
  lobby.hide()
  menu.show()
}

net.onGameStart = (data) => {
  lobby.hide()
  game.start(data)
}

net.onReturnToLobby = (data) => {
  game.stop()
  lobby.show(data)
}
