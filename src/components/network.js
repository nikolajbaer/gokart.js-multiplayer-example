import { Component, Types } from "ecsy"

// identifies which entity to update from the server snapshots (mapping server entity ids)
export class NetworkSyncComponent extends Component {}
NetworkSyncComponent.schema = {
  id: { type: Types.Number }, // id on server
}

