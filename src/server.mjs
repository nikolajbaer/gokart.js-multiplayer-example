import geckos from '@geckos.io/server'

// https://github.com/geckosio/geckos.io/issues/99#issuecomment-874893807
const io = geckos({
 portRange: {
    min: 50000,
    max: 50200
  }
})

io.listen(9208) // default port is 9208

io.onConnection(channel => {
  channel.onDisconnect(() => {
    console.log(`${channel.id} got disconnected`)
  })

  channel.on('chat message', data => {
    console.log(`got ${data} from "chat message"`)
    // emit the "chat message" data to all channels in the same room
    io.room(channel.roomId).emit('chat message', data)
  })
})