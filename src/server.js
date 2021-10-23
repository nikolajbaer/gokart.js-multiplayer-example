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

const scene = new TestServerScene()
scene.init(null,false)
//scene.start()
scene.init_entities()
const UPDATE_INTERVAL = 1000/20
function loop(){
  scene.loop()
}

const updateLoop = setInterval(loop, UPDATE_INTERVAL, scene)

io.onConnection(channel => {
  console.log("Connection!",channel.id)
  channel.onDisconnect(() => {
    console.log(`${channel.id} got disconnected`)
  })

  channel.on('chat message', data => {
    console.log(`got ${data} from "chat message"`)
    // emit the "chat message" data to all channels in the same room
    io.room(channel.roomId).emit('chat message', data)
  })
})