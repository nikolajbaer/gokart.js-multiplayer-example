import { LocRotComponent } from "gokart.js/src/core/components/position.js"
import { ModelComponent, UpdateFromLocRotComponent } from "gokart.js/src/core/components/render.js"
import { NetworkPlayerComponent, NetworkSyncComponent } from "./components/network.js"
import { Vector3 } from "gokart.js/src/core/ecs_types.js"

export class ComponentSerializer {
  get_entity_state(e){
    const locrot = e.getComponent(LocRotComponent)
    const result = {
      id: e.id,
      x: locrot.location.x,
      y: locrot.location.y,
      z: locrot.location.z,
      rx: locrot.rotation.x,
      ry: locrot.rotation.y,
      rz: locrot.rotation.z,
    }
    return result
  }

  get_entity_init(e){
    const model = e.getComponent(ModelComponent)
    const locrot = e.getComponent(LocRotComponent)

    // CONSIDER Component Serializer?
    const data = {
      id: e.id , // server's entity id
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
    }

    if(e.hasComponent(NetworkPlayerComponent)){
      const np = e.getComponent(NetworkPlayerComponent)
      data.player_channel = np.channel
      data.player_name = np.name
    }

    return data
  }

  // snap is snapshot from interpolator
  process_entity_update(e,snap){
    const lr = e.getMutableComponent(LocRotComponent) 
    lr.location.x = snap.x
    lr.location.y = snap.y
    lr.location.z = snap.z
    lr.rotation.x = snap.rx
    lr.rotation.y = snap.ry
    lr.rotation.z = snap.rz
  }

  process_entity_init(data,e){
    e.name = data.name
    e.addComponent(NetworkSyncComponent,{id:data.id}) 
    e.addComponent(LocRotComponent,{
      location:new Vector3(data.x,data.y,data.z),
      rotation:new Vector3(data.rx,data.ry,data.rz)
    })
    e.addComponent(ModelComponent,{
      geometry: data.geom,
      material: data.mtl,
      scale: new Vector3(data.sx,data.sy,data.sz),
      cast_shadow: data.cshdw,
      receive_shadow: data.rshdw,
    }) 

    // TODO make this use physics where applicable
    e.addComponent(UpdateFromLocRotComponent)

    return e
  }
}