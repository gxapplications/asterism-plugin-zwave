'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerAction } = Scenarii

export default class ServerZwaveBinarySwitchAction extends ServerAction {
  get name () {
    return this.data.name ? `Switch control: ${this.data.name}` : `Misconfigured switch control on node #${this.data.nodeId}`
  }

  execute (executionId) {
    const node = ServerZwaveBinarySwitchAction.zwaveService.getNodeById(this.data.nodeId)
    if (!node) {
      ServerZwaveBinarySwitchAction.logger.warning(`Binary switch action failed: node "${this.data.nodeId} not ready.`)
      return Promise.reject(false)
    }
    if (!node.binarySwitchTurnOn || !node.binarySwitchTurnOff || !node.binarySwitchInvert) {
      ServerZwaveBinarySwitchAction.logger.error(`Binary switch action failed: node "${this.data.nodeId} not compatible with the action.`)
      return Promise.reject(false)
    }

    return new Promise((resolve, reject) => {
      switch (this.data.controlMode) {
        case 'invert':
        default:
          node.binarySwitchInvert()
          break
        case 'force-off':
          node.binarySwitchTurnOff()
          break
        case 'force-on':
          node.binarySwitchTurnOn()
      }
      resolve(true)
    })
  }
}
