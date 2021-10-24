import { System } from "ecsy"
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation'
import { NetworkSyncComponent } from "../components/network.js"
import { LocRotComponent } from "gokart.js/src/core/components/position.js"

export class NetworkServerSystem extends System {
  init(attributes){
    this.SI = new SnapshotInterpolation()
    this.snapshot = null
  }

  add_client(){
    // create player entity 
    // make sure they get an init snapshot? 
  }

  execute(delta,time){
    const world_state = []
    this.queries.synced.results.forEach( e => {
      // probably could be way more efficient
      const locrot = e.getComponent(LocRotComponent)
      world_state.push({
        id: e.id,
        x: locrot.location.x,
        y: locrot.location.y,
        z: locrot.location.z,
        rx: locrot.rotation.x,
        ry: locrot.rotation.y,
        rz: locrot.rotation.z,
      })
    })
    const snapshot = this.SI.snapshot.create(world_state)
    this.SI.vault.add(snapshot)
    this.snapshot = snapshot
  }
}

NetworkServerSystem.queries = {
  synced: {
    components: [NetworkSyncComponent,LocRotComponent]
  }
}
