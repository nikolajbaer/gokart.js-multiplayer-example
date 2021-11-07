import { LocRotComponent } from "gokart.js/src/core/components/position.js"
import { ModelComponent } from "gokart.js/src/core/components/render.js"
import { initialize_test_world } from "gokart.js/src/core/testing/game_helpers.js"
import { PhysicsSystem } from "gokart.js/src/core/systems/physics.js"
import { ApplyVelocityComponent, BodyComponent, CollisionComponent, KinematicCharacterComponent, PhysicsComponent, PhysicsControllerComponent, SetRotationComponent } from "gokart.js/src/core/components/physics.js"
import { Vector3 } from "gokart.js/src/core/ecs_types.js"
import test from 'ava'
import loadAmmo from "ammo.js/tests/helpers/load-ammo.js"
import { OnGroundComponent } from "gokart.js/src/common/components/movement.js"
import { ComponentSerializer } from "./component_serializer.js"
import { NetworkSyncComponent } from "./components/network.js"

test.before(async t => loadAmmo())

test('serialize locrot component', t => {
  const world = initialize_test_world([],[LocRotComponent])
  const serializer = new ComponentSerializer()
  const e = world.createEntity()
  e.addComponent(LocRotComponent,{
    location:new Vector3(1,2,3),
    rotation: new Vector3(0.1,0.2,0.3)
  })
  const init_data = serializer.get_entity_init(e)
  t.is(init_data.id,e.id)
  t.deepEqual(init_data.c[0],{x:1,y:2,z:3,rx:0.1,ry:0.2,rz:0.3})
})

test('deserialize locrot component', t => {
  const world = initialize_test_world([],[LocRotComponent,NetworkSyncComponent])

  const e = world.createEntity()
  const serializer = new ComponentSerializer()
  // Components are positional
  const data = {
    id:123,c:[
      {x:1,y:2,z:3,rx:0.1,ry:0.2,rz:0.3}
    ]
  }
  serializer.process_entity_init(data,e)

  // should have a network sync component
  t.true(e.hasComponent(NetworkSyncComponent))
  t.is(e.getComponent(NetworkSyncComponent).id,data.id)

  // and a locrot
  t.true(e.hasComponent(LocRotComponent))
  const locrot = e.getComponent(LocRotComponent)
  t.is(locrot.location.x,data.c[0].x)
  t.is(locrot.location.y,data.c[0].y)
  t.is(locrot.location.z,data.c[0].z)
  t.is(locrot.rotation.x,data.c[0].rx)
  t.is(locrot.rotation.y,data.c[0].ry)
  t.is(locrot.rotation.z,data.c[0].rz)

})

test('entity init communicates sync status', t => {
  const world = initialize_test_world([],[LocRotComponent])
  const serializer = new ComponentSerializer()
  const e = world.createEntity()
  e.addComponent(LocRotComponent,{
    location:new Vector3(1,2,3),
    rotation: new Vector3(0.1,0.2,0.3)
  })
  
  const init_data = serializer.get_entity_init(e,false)
  t.false(init_data.sync)

  const init_data1 = serializer.get_entity_init(e,true)
  t.true(init_data1.sync)

  const e1 = world.createEntity()
  serializer.process_entity_init(init_data,e1)
  t.false(e1.getComponent(NetworkSyncComponent).sync)

  const e2 = world.createEntity()
  serializer.process_entity_init(init_data1,e2)
  t.true(e2.getComponent(NetworkSyncComponent).sync)

})

test('physics bodies communicate state', t => {
    const world = initialize_test_world(
        [{system:PhysicsSystem,attr:{ammo:Ammo}}],
        [
            LocRotComponent,
            BodyComponent,
            ModelComponent,
            PhysicsComponent,
            PhysicsControllerComponent,
            SetRotationComponent,
            CollisionComponent,
            KinematicCharacterComponent,
            ApplyVelocityComponent,
            NetworkSyncComponent,
            OnGroundComponent,
        ]
    )

    // first rigid body 
    const e = world.createEntity()
    e.addComponent( BodyComponent, {mass:13} ) 
    e.addComponent( NetworkSyncComponent,{id:123} )
    e.addComponent(LocRotComponent,{location:new Vector3(0,0,0),rotation: new Vector3(0,0,0)})
   
    const serializer = new ComponentSerializer()

    const data = serializer.get_entity_init(e)
    t.is(data.c[2].mass, 13)
 
    const psys = world.getSystem(PhysicsSystem)
    psys.execute(1,1)

    t.true(e.hasComponent(PhysicsComponent))
    const state = serializer.get_entity_state(e)

    const body = e.getComponent(PhysicsComponent).body
    const btTransform = body.getWorldTransform() //.getCenterOfMassTransform()
    const pos = btTransform.getOrigin()
    t.is(state.x,pos.x())
    t.is(state.y,pos.y())
    t.is(state.z,pos.z())
    t.not(state.y,0) // hopefully we have fallen a bit

    // Now try initializing a new entity
    const e1 = world.createEntity()
    serializer.process_entity_init(data,e1)
    t.true(e1.hasComponent(LocRotComponent))
    t.true(e1.hasComponent(BodyComponent))
    psys.execute(1,2)
    t.true(e1.hasComponent(PhysicsComponent))

    // Now update state
    state.x = 100
    state.y = 200
    state.z = 300
    serializer.process_entity_update(e,state)
    const btTransform1 = body.getWorldTransform() //.getCenterOfMassTransform()
    const pos1 = btTransform1.getOrigin()
    console.log(state,pos1.x(),pos1.y(),pos1.z())
    t.is(pos1.x(),100)
    t.is(pos1.y(),200)
    t.is(pos1.z(),300)

    // Now with a kinematic character controller 
    const p = world.createEntity()
    p.addComponent(BodyComponent, {body_type: BodyComponent.KINEMATIC_CHARACTER}) 
    p.addComponent(KinematicCharacterComponent)
    p.addComponent(NetworkSyncComponent,{id:123} )
    p.addComponent(LocRotComponent,{location:new Vector3(10,0,10),rotation: new Vector3(0,0.5,0)})

    const datap = serializer.get_entity_init(p)
    // We should convert to kinematic for clients who are not the player
    //  that way they just interpolate movement driven by character controllers 
    // on the server. The Exception is the client's own player. TODO how do we instantiate that
    // on the client?
    t.is(datap.c[2].body_type, BodyComponent.KINEMATIC)
    t.is(datap.c[0].ry, 0.5)
 
    psys.execute(1,3)
    psys.execute(1,4)

})

