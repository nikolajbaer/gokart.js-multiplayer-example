import { TestScene } from "./scene.js"
import { BodyComponent } from "gokart.js/src/core/components/physics.js"
import { Vector3 } from "gokart.js/src/core/ecs_types.js"
import { LocRotComponent } from "gokart.js/src/core/components/position.js"

export class TestServerScene extends TestScene {
  constructor(){
    super()
    this.elapsed = 0
    this.time_step = 1000/20 // 20 tick server?
  }

  register_network_systems(){
  }

  register_ui_systems(){
    // don't register ui systems
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
      g.name = "ground_plane"

      for(var i=0;i<5;i++){
        const box = this.world.createEntity()
        box.addComponent(LocRotComponent,{location: new Vector3(0,10+i*3,0),rotation: new Vector3(i*Math.PI/10,0,i*Math.PI/10)})
        box.addComponent(BodyComponent,{mass:1,bounds_type:BodyComponent.BOX_TYPE,bounds: new Vector3(1,1,1)})
        box.name = "box"+i
      }
  }
}