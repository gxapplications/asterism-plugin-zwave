'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerAction } = Scenarii

export default class ServerZwaveMeterResetAction extends ServerAction {
  get name () {
    return this.data.name ? `Meter reset ${this.data.name}` : `Misconfigured meter reset on nodes ${this.data.nodeIds.join(', ')}`
  }

  execute (executionId) {
    const nodes = this.data.nodeIds.map((id) => ServerZwaveBinarySwitchAction.zwaveService.getNodeById(id)).filter((node, index) => {
      if (!node) {
        ServerZwaveMeterResetAction.logger.warning(`Meter reset action failed: node "${this.data.nodeIds[index]} not ready.`)
      }
      return !!node
    })

    if (nodes.length === 0) {
      return Promise.reject(false)
    }

    return new Promise((resolve, reject) => {
      nodes.forEach((node) => {
        node.meterResetCounter()
      })
      resolve(true)
    })
  }
}
