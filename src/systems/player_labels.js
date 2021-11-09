import { System } from "ecsy"
import { Project2dComponent } from "gokart.js/src/core/components/render.js"
import { NetworkPlayerComponent, NetworkSyncComponent } from "../components/network"

export class PlayerLabelSystem extends System {
    init(attributes){
      this.labels = {}
      this.parent = document.getElementById(attributes.overlay_element_id) 
      this.class = attributes.class
      this.offset = attributes.offset
    }

    execute(delta,time){

      this.queries.players.added.forEach( e => {
        if(!e.hasComponent(Project2dComponent)){
          e.addComponent(Project2dComponent)
        }
        const id = e.getComponent(NetworkSyncComponent).id
        const el = document.createElement("div")
        el.className = this.class
        const name = e.getComponent(NetworkPlayerComponent).name
        el.innerText = name 
        console.log("Adding new player label",name,el,this.parent)
        this.parent.appendChild(el)
        this.labels[id] = el
      })

      this.queries.players.removed.forEach( e => {
        const id = e.getComponent(NetworkSyncComponent).id
        this.parent.removeChild(this.labels[id])
      })

      this.queries.players.results.forEach( e => {
        const id = e.getComponent(NetworkSyncComponent).id
        const pr2d = e.getComponent(Project2dComponent)
        const left = ((1+pr2d.x) * (this.parent.clientWidth/2) + this.offset.x) + "px"
        const top = ((1 + -1*pr2d.y) * (this.parent.clientHeight/2) + this.offset.y) + "px"
        this.labels[id].style.left = left
        this.labels[id].style.top = top
      })
    }
}
PlayerLabelSystem.queries = {
  players: {
    components: [NetworkPlayerComponent,NetworkSyncComponent],
    listen: {
      added: true,
      removed: true,
    }
  }
}