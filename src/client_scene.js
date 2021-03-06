import { CameraComponent } from "gokart.js/src/core/components/render.js"
import { Vector3 } from "gokart.js/src/core/ecs_types.js"
import { LocRotComponent } from "gokart.js/src/core/components/position.js"
import { NetworkClientSystem } from "./systems/network_client.js"
import { NetworkPlayerComponent, NetworkSyncComponent } from "./components/network.js"
import { Physics3dScene } from "gokart.js/src/scene/physics3d.js"
import { ComponentSerializer } from "./component_serializer.js"
import { MoverComponent, OnGroundComponent } from "gokart.js/src/common/components/movement.js"
import { MovementSystem } from "gokart.js/src/common/systems/movement.js"
import { PlayerLabelSystem } from "./systems/player_labels.js"
import { OrbitControlsSystem } from "gokart.js/src/common/systems/orbit_controls.js"
import { OrbitControlComponent } from "gokart.js/src/common/components/orbit_controls.js"
import { CameraFollowComponent } from "gokart.js/src/common/components/camera_follow.js"
import { CameraFollowSystem } from "gokart.js/src/common/systems/camera_follow.js"

export class TestClientScene extends Physics3dScene {
    constructor(player_name){
        super()
        this.player_name = player_name
    }
    register_components(){
        super.register_components()
        this.world.registerComponent(NetworkSyncComponent)
        this.world.registerComponent(MoverComponent)
        this.world.registerComponent(OnGroundComponent)
        this.world.registerComponent(NetworkPlayerComponent)
        this.world.registerComponent(OrbitControlComponent)
        this.world.registerComponent(CameraFollowComponent)
    }

    register_systems(){
        super.register_systems()
        this.world.registerSystem(CameraFollowSystem)
        this.world.registerSystem(NetworkClientSystem,{serializer:new ComponentSerializer(),player_name:this.player_name})
        this.world.registerSystem(MovementSystem)
        this.world.registerSystem(PlayerLabelSystem, {
            overlay_element_id: "container",
            class:"player_label",
            offset: {x:-50,y:-80},
        })
    }

    init_entities(){
        const c = this.world.createEntity()
        c.addComponent(CameraComponent,{lookAt: new Vector3(0,0,1),current: true, fov:60})
        c.addComponent(LocRotComponent,{location: new Vector3(5,20,-20)})
    }
}