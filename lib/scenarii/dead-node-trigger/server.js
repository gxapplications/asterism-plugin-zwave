'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerTrigger } = Scenarii

export default class ServerZwaveDeadNodeTrigger extends ServerTrigger {
  constructor (data) {
    super(data)
    this.sourceListener = null

    // This is a permanent listener, but will filter on notification #5 (dead node). Do not rely on this.data that can change...
    ServerZwaveDeadNodeTrigger.zwaveService.context.zwave.on('notification', (nodeId, notification) => {
      if (this.sourceListener && notification === 5) { // ( => Dead node notification case
        this.sourceListener(nodeId)
      }
    })
  }

  get name () {
    return this.data.name ? `${this.data.name} just dead` : `Misconfigured dead node trigger on node #${this.data.nodeId}`
  }

  reschedule () {
    this.cancelEvents()
    if (this.listeners.filter((l) => !l.lazy).length === 0) {
      ServerZwaveDeadNodeTrigger.logger.info(`Trigger ${this.data.name} has no active listener. Trigger unscheduled.`)
      // there is no mandatory listeners (lazy are called only if there is 'no lazy listeners' registered). So do no schedule.
      return Promise.resolve(true)
    }
    return this.scheduleEvents()
  }

  cancelEvents () {
    if (this.sourceListener) {
      delete this.sourceListener
    }
  }

  scheduleEvents () {
    try {
      this.sourceListener = (nodeId) => {
        if (!this.data.nodeIds.includes(nodeId)) {
          return
        }

        this.listeners.forEach((listener) => listener())
      }
      return Promise.resolve(true)
    } catch (error) {
      return Promise.reject(error)
    }
  }
}
