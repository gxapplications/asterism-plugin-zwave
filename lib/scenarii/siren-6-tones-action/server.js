'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerAction } = Scenarii

export default class ServerZwaveSiren6TonesAction extends ServerAction {
  nodesList () {
    return this.data.nodeIds.join(',')
  }

  get name () {
    const defaultName = `Misconfigured siren control on nodes ${this.nodesList()}`
    return this.data.name ? `Siren ${this.data.name} with ${this.data.tone}` : defaultName
  }

  execute (executionId) {
    const nodes = this.data.nodes
      .map(({ id, instance }) => ({ node: ServerZwaveSiren6TonesAction.zwaveService.getNodeById(id), instance }))
      .filter(({ node, instance }, index) => {
        if (!node) {
          ServerZwaveSiren6TonesAction.logger.warning(`Siren 6 tones action failed: node "${this.data.nodes[index].id} not ready.`)
          return false
        }
        if (!node.playTone) {
          ServerZwaveSiren6TonesAction.logger.error(`Siren 6 tones action failed: node "${this.data.nodes[index].id} not compatible with the action.`)
          return false
        }
        return true
      })
    if (nodes.length === 0) {
      return Promise.reject(false)
    }

    return new Promise((resolve) => {
      nodes.forEach(({ node, instance }) => {
        // TODO !1
      })
      resolve(true)
    })
  }
}
