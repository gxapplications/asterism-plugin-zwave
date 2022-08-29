'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerCondition } = Scenarii

export default class ServerZwaveBinarySwitchStateCondition extends ServerCondition {
  get name () {
    return this.data.name ? `Switch ${this.data.name}` : `Misconfigured Z-wave switch state condition`
  }

  test () {
    // case 'on' by default
    const operation = (this.data.state === 'on') ? ((v) => v) : ((v) => !v)

    return Promise.all(this.data.nodes.map(({ id, instance }) => {
      const node = ServerZwaveBinarySwitchStateCondition.zwaveService.getNodeById(id)
      if (!node) {
        throw new Error(`Node #${id} cannot be retrieved.`)
      }

      return operation(node.binarySwitchGetState(instance))
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
