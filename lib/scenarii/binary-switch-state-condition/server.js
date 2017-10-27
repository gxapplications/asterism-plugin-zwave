'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerCondition } = Scenarii

export default class ServerZwaveBinarySwitchStateCondition extends ServerCondition {
  get name () {
    return this.data.name ? `Switch ${this.data.name}` : `Misconfigured Z-wave switch state condition`
  }

  test () {
    // case 'on' by default
    let operation = (this.data.state === 'on') ? ((v) => v) : ((v) => !v)

    return Promise.all(this.data.nodeIds.map(nodeId => {
      const node = ServerZwaveBinarySwitchStateCondition.zwaveService.getNodeById(nodeId)
      if (!node) {
        throw new Error(`Node #${nodeId} cannot be retrieved.`)
      }

      return operation(node.binarySwitchGetState())
    }))
    .then((results) => {
      switch (this.data.aggregation) {
        case 'any':
        default:
          return results.includes(true) // at least one is true (logical OR)
        case 'every':
          return !results.includes(false) // each of them (logical AND)
      }
    })
  }
}
