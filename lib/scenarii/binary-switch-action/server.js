'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerAction } = Scenarii

export default class ServerZwaveBinarySwitchAction extends ServerAction {
  nodesList () {
    return this.data.nodes.map(({ id, instance }) => instance > 1 ? `${id}(${instance})` : id).join(',')
  }

  get name () {
    const defaultName = `Misconfigured switch control on nodes ${this.nodesList()}`
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

  thenWait(time) {
    return () => new Promise((resolve) => {
      setTimeout(resolve, time)
    })
  }

  execute (executionId) {
    const nodes = this.data.nodes
      .map(({ id, instance }) => ({ node: ServerZwaveBinarySwitchAction.zwaveService.getNodeById(id), instance }))
      .filter(({ node, instance }, index) => {
        if (!node) {
          ServerZwaveBinarySwitchAction.logger.warning(`Binary switch action failed: node #${this.data.nodes[index].id} not ready.`)
          return false
        }
        if (!node.binarySwitchTurnOn || !node.binarySwitchTurnOff || !node.binarySwitchInvert) {
          ServerZwaveBinarySwitchAction.logger.error(`Binary switch action failed: node #${this.data.nodes[index].id} not compatible with the action.`)
          return false
        }
        return true
      })
    if (nodes.length === 0) {
      return Promise.reject(false)
    }

    return nodes.reduce((previous, { node, instance }) => {
      return previous
        .then(() => {
          switch (this.data.controlMode) {
            case 'invert':
            default:
              node.binarySwitchInvert(instance)
              break
            case 'force-off':
              node.binarySwitchTurnOff(instance)
              break
            case 'force-on':
              node.binarySwitchTurnOn(instance)
          }
        })
        .then(this.thenWait(300))
    }, Promise.resolve())
    .then(() => true)
  }
}
