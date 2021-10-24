import { System } from "ecsy"
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation'
import { NetworkSyncComponent } from "../components/network.js"
import { LocRotComponent } from "gokart.js/src/core/components/position.js"
import { ModelComponent } from "../../gokart.js/src/core/components/render.js"
import { Vector3 } from "../../gokart.js/src/core/ecs_types.js"
import { KinematicCharacterComponent } from "../../gokart.js/src/core/components/physics.js"
import { BodyComponent } from "../../gokart.js/src/core/components/physics.js"

export class NetworkServerSystem extends System {
  init(attributes){
    this.SI = new SnapshotInterpolation()
    this.snapshot = null
  }

  get_init_data(){
    // TODO also sync lights?
    const init = []
    this.queries.synced.results.forEach( e => {
      const model = e.getComponent(ModelComponent)
      const locrot = e.getComponent(LocRotComponent)
      init.push({
        id: e.id ,
        geom: model.geometry,
        mtl: model.material,
        sx: model.scale.x,
        sy: model.scale.y,
        sz: model.scale.z,
        cshdw: model.cast_shadow,
        rshdw: model.receive_shadow,
        x: locrot.location.x,
        y: locrot.location.y,
        z: locrot.location.z,
        rx: locrot.rotation.x,
        ry: locrot.rotation.y,
        rz: locrot.rotation.z,
        name: e.name,
      })
    })
    return init
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

// NOTE: we add model component even though we aren't using it to render on
// server, so that we know what to render on the client
NetworkServerSystem.queries = {
  synced: {
    components: [NetworkSyncComponent,LocRotComponent,ModelComponent],
  },
}
