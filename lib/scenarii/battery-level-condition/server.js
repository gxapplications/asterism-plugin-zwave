'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerCondition } = Scenarii

export default class ServerZwaveBatteryLevelCondition extends ServerCondition {
  get name () {
    return this.data.name ? `Battery ${this.data.name}` : `Misconfigured Z-wave battery level condition`
  }

  test () {
    // case 'below' by default
    let operation = (v) => v <= this.data.limit
    switch (this.data.operator) {
      case 'above':
        operation = (v) => v >= this.data.limit
        break
      case 'between':
        operation = (v) => (v >= this.data.limit2 && v <= this.data.limit)
        break
    }

    return Promise.all(this.data.nodeIds.map(nodeId => {
      const node = ServerZwaveBatteryLevelCondition.zwaveService.getNodeById(nodeId)
      if (!node) {
        return (this.data.operator === 'below') // TODO !9: returns that, or throw an error ?
      }

      return operation(node.batteryLevelGetPercent())
    }))
    .then((results) => results.includes(true)) // at least one is true (logical OR)
  }
}
