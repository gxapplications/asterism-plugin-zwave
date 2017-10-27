'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerCondition } = Scenarii

export default class ServerZwaveTemperatureCondition extends ServerCondition {
  get name () {
    return this.data.name ? `Temperature ${this.data.name}` : `Misconfigured Z-wave Temperature condition`
  }

  test () {
    // case 'between' by default
    let operation = (v) => (v >= this.data.limit2 && v <= this.data.limit)
    switch (this.data.operator) {
      case 'above':
        operation = (v) => v >= this.data.limit
        break
      case 'below':
        operation = (v) => v <= this.data.limit
        break
    }

    return Promise.all(this.data.nodeIds.map(nodeId => {
      const node = ServerZwaveTemperatureCondition.zwaveService.getNodeById(nodeId)
      if (!node) {
        throw new Error(`Node #${nodeId} cannot be retrieved.`)
      }

      return (this.data.aggregation === 'average') ? node.sensorMultiLevelGetValue() : operation(node.sensorMultiLevelGetValue())
    }))
    .then((results) => {
      switch (this.data.aggregation) {
        case 'any':
        default:
          return results.includes(true) // at least one is true (logical OR)
        case 'every':
          return !results.includes(false) // each of them (logical AND)
        case 'average':
          return operation(results.reduce((acc, v) => acc + parseFloat(v), 0) / (results.length || 1)) === true // average of values
      }
    })
  }
}
