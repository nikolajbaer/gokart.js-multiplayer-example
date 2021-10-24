import { BodyComponent } from "gokart.js/src/core/components/physics.js"
import { Vector3 } from "gokart.js/src/core/ecs_types.js"
import { LocRotComponent } from "gokart.js/src/core/components/position.js"
import { NetworkServerSystem } from "./systems/network_server.js"
import { Physics3dScene } from "gokart.js/src/scene/physics3d.js"
import { NetworkSyncComponent } from "./components/network.js"
import { PhysicsLocRotUpdateSystem } from "gokart.js/src/core/systems/physics"

export class TestServerScene extends Physics3dScene {
  constructor(){
    super()
    this.elapsed = 0
    this.time_step = 1000/20 // 20 tick server?
  }

  register_components(){
      super.register_components()
      this.world.registerComponent(NetworkSyncComponent)
  }

  register_systems(){
    this.world.registerSystem(PhysicsLocRotUpdateSystem)
    super.register_systems()
    this.world.registerSystem(NetworkServerSystem)
  }

  register_ui_systems(){
    // don't register ui systems
    // TODO refactor in gokart to have a base scene and layer on a SinglePlayer Scene
  }

  get_snapshot(){
    const nsys = this.world.getSystem(NetworkServerSystem)
    if(nsys){ return nsys.snapshot }
    return null
  }

  loop(){
      if(this.destroyed){
          console.log("scene exiting")
          return
      }

      let delta = this.time_step
      this.elapsed += delta
      let time = this.elapsed
      this.world.execute(delta,time) 

  }

  init_entities(){
      const g = this.world.createEntity()
      g.addComponent( BodyComponent, {
          mass: 0,
          bounds_type: BodyComponent.BOX_TYPE,
          body_type: BodyComponent.STATIC,
          bounds: new Vector3(1000,1,1000),
      })
      g.addComponent( LocRotComponent, { rotation: new Vector3(0,0,0), location: new Vector3(0,-0.5,0) } )
      g.addComponent(NetworkSyncComponent,{id:g.id})
      g.name = "ground_plane"

      for(var i=0;i<5;i++){
        const box = this.world.createEntity()
        box.addComponent(LocRotComponent,{location: new Vector3(0,10+i*3,0),rotation: new Vector3(i*Math.PI/10,0,i*Math.PI/10)})
        box.addComponent(BodyComponent,{mass:1,bounds_type:BodyComponent.BOX_TYPE,bounds: new Vector3(1,1,1)})
        box.addComponent(NetworkSyncComponent,{id:box.id})
        box.name = "box"+i
      }
  }
}