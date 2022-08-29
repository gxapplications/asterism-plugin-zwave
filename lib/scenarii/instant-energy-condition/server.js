'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerCondition } = Scenarii

export default class ServerZwaveInstantEnergyCondition extends ServerCondition {
  get name () {
    return this.data.name ? `Power ${this.data.name}` : `Misconfigured Z-wave Instant energy condition`
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
      const node = ServerZwaveInstantEnergyCondition.zwaveService.getNodeById(nodeId)
      if (!node) {
        throw new Error(`Node #${nodeId} cannot be retrieved.`)
      }

      return (this.data.aggregation === 'sum') ? node.sensorMultiLevelGetValue() : operation(node.sensorMultiLevelGetValue())
    }))
    .then((results) => {
      switch (this.data.aggregation) {
        case 'any':
        default:
          return results.includes(true) // at least one is true (logical OR)
        case 'every':
          return !results.includes(false) // each of them (logical AND)
        case 'sum':
          return operation(results.reduce((acc, v) => acc + v)) === true // sum of values
      }
    })
  }
}
