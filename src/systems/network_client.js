import { System } from "ecsy"
import { geckos } from "@geckos.io/client"
import { ActionListenerComponent } from "gokart.js/src/core/components/controls.js"
import { NetworkSyncComponent } from "../components/network"
import { LocRotComponent } from "gokart.js/src/core/components/position.js"
import { Vector3 } from "gokart.js/src/core/ecs_types"
import { ModelComponent, UpdateFromLocRotComponent } from "gokart.js/src/core/components/render.js"
import { SnapshotInterpolation } from "@geckos.io/snapshot-interpolation"

export class NetworkClientSystem extends System {
  init(attributes){
    this.channel = geckos() // default port is 9208
    console.log("Connecting")
    this.SI = new SnapshotInterpolation(20) // TODO get fps from server on init?
    this.channel.onConnect(error => {
      console.log("Connected!")
      if(error){ console.error(error.message) }

      // We may want this to be connected to preact, and just pass the update messages directly here?
      this.channel.on('chat message', data => {
        console.log('chat message',data)
      })

      this.channel.on('init', data => {
        this.initialize_entities(data)
      })

      this.channel.on('update', data => {
        this.SI.snapshot.add(data)
      })
    })
  }

  initialize_entities(server_entities){
    console.log("initializing",server_entities)
    server_entities.forEach( d => {
      const e = this.world.createEntity()
      e.name = d.name
      e.addComponent(NetworkSyncComponent,{id:d.id}) 
      e.addComponent(LocRotComponent,{
        location:new Vector3(d.x,d.y,d.z),
        rotation:new Vector3(d.rx,d.ry,d.rz)
      })
      e.addComponent(UpdateFromLocRotComponent)
      e.addComponent(ModelComponent,{
        geometry: d.geom,
        material: d.mtl,
        scale: new Vector3(d.sx,d.sy,d.sz),
        cast_shadow: d.cshdw,
        receive_shadow: d.rshdw,
      })
    })
  }

  execute(delta,time){
    this.queries.action_listeners.results.forEach( e => {
      const actions = e.getComponent(ActionListenerComponent).actions
      // TODO emit action state?
      //  this.channel.emit('chat message',"UP")
    })

    // Update from snapshot system once we have one
    const snapshot = this.SI.calcInterpolation('x y')
    if(snapshot){
      const { state } = snapshot

      // build dict of entities to sync
      const to_sync = {}
      this.queries.network_entities.results.forEach( e => {
        const ns = e.getComponent(NetworkSyncComponent)
        to_sync[ns.id] = e
      })

      // walk through updated state and update entities
      state.forEach( snap => {
        let e = null
        if(to_sync[snap.id]){
          e = to_sync[snap.id]
        }else{
          // TODO create new entity? 
          console.log("TODO create new entities")
          return
        }
        const lr = e.getMutableComponent(LocRotComponent) 
        lr.location.x = snap.x
        lr.location.y = snap.y
        lr.location.z = snap.z
        lr.rotation.x = snap.rx
        lr.rotation.y = snap.ry
        lr.rotation.z = snap.rz
      })
    }
  }
}

NetworkClientSystem.queries = {
  action_listeners: {
    components: [ActionListenerComponent]
  },
  network_entities: {
    components: [NetworkSyncComponent,LocRotComponent]
  }
}
