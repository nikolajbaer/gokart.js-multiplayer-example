import { System } from "ecsy"
import { geckos } from "@geckos.io/client"
import { ActionListenerComponent } from "gokart.js/src/core/components/controls.js"

export class NetworkSystem extends System {
  init(attributes){
    this.channel = geckos() // default port is 9208
    this.channel.onConnect(error => {
      console.log("Connected!")
      if(error){ console.error(error.message) }

      // We may want this to be connected to preact, and just pass the update messages directly here?
      this.channel.on('chat message', data => {
        console.log('chat message',data)
      })
    })
  }

  execute(delta,time){
    this.queries.action_listeners.results.forEach( e => {
      const actions = e.getComponent(ActionListenerComponent).actions
      if(actions.up){
        console.log("emitting message")
        this.channel.emit('chat message',"UP")
      }
    })
  }
}
NetworkSystem.queries = {
  action_listeners: {
    components: [ActionListenerComponent]
  }
}

