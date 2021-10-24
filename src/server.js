import geckos from '@geckos.io/server'

import { TestServerScene } from './server_scene.js'

// https://github.com/geckosio/geckos.io/issues/99#issuecomment-874893807
const io = geckos({
 portRange: {
    min: 50000,
    max: 50200
  }
})

io.listen(9208) // default port is 9208

// Our clients / room.. todo make multiple rooms, with 1 scene per
const clients = {}
let room = null

const scene = new TestServerScene()
scene.init(null,false)
//scene.start()
scene.init_entities()
const UPDATE_INTERVAL = 1000/20
function loop(){
  scene.loop()
  io.room(room).emit('update',scene.get_snapshot())
}

const updateLoop = setInterval(loop, UPDATE_INTERVAL, scene)

io.onConnection(channel => {
  console.log("Connection!",channel.id," in room ",channel.roomId)
  if(!room){ room = channel.roomId }

  channel.onDisconnect(() => {
    console.log(`${channel.id} got disconnected`)
  })

  // TODO differentiate init with maybe loader instructions for meshes
  channel.emit('init',scene.get_snapshot())

  channel.on('chat message', data => {
    console.log(`got ${data} from "chat message"`)
    // emit the "chat message" data to all channels in the same room
    io.room(channel.roomId).emit('chat message', data)
  })
})
