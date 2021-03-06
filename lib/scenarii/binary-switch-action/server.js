'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerAction } = Scenarii

export default class ServerZwaveBinarySwitchAction extends ServerAction {
  get name () {
    const defaultName = `Misconfigured switch control on nodes ${this.data.nodeIds.join(',')}`
    switch (this.data.controlMode) {
      case 'invert':
      default:
        return this.data.name ? `Inverts ${this.data.name}` : defaultName
      case 'force-on':
        return this.data.name ? `Turns ON ${this.data.name}` : defaultName
      case 'force-off':
        return this.data.name ? `Turns OFF ${this.data.name}` : defaultName
    }
  }

  execute (executionId) {
    const nodes = this.data.nodeIds.map((id) => ServerZwaveBinarySwitchAction.zwaveService.getNodeById(id)).filter((node, index) => {
      if (!node) {
        ServerZwaveBinarySwitchAction.logger.warning(`Meter reset action failed: node "${this.data.nodeIds[index]} not ready.`)
        return false
      }
      if (!node.binarySwitchTurnOn || !node.binarySwitchTurnOff || !node.binarySwitchInvert) {
        ServerZwaveBinarySwitchAction.logger.error(`Binary switch action failed: node "${this.data.nodeIds[index]} not compatible with the action.`)
        return false
      }
      return true
    })
    if (nodes.length === 0) {
      return Promise.reject(false)
    }

    return new Promise((resolve, reject) => {
      nodes.forEach((node) => {
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
      })
      resolve(true)
    })
  }
}
