'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerTrigger } = Scenarii

export default class ServerZwaveBatteryLevelTrigger extends ServerTrigger {
  constructor (data) {
    super(data)
    this.sourceListener = null
    this.deviceStates = {}

    // This is a permanent listener, but will filter on comClass 128 (battery level). Do not rely on this.data that can change...
    ServerZwaveBatteryLevelTrigger.zwaveService.context.zwave.on('value changed', (nodeId, comClass, values) => {
      if (comClass === 128 && values.index === 0) {

        const product = ServerZwaveBatteryLevelTrigger.zwaveService.getNodeById(nodeId)
        values.percent = product.batteryLevelGetPercent(values.instance)

        if (this.sourceListener && this.deviceStates[nodeId] && (
                this.deviceStates[nodeId].percent !== values.percent
                || this.deviceStates[nodeId].instance !== values.instance
            )) {
          this.sourceListener(nodeId, this.deviceStates[nodeId].percent, values.percent)
        }
        this.deviceStates[nodeId] = values
      }
    })

    // init values when zwave network is ready
    ServerZwaveBatteryLevelTrigger.zwaveService.context.zwave.on('scan complete', () => {
      setTimeout(() => {
        this.data.nodeIds.forEach(nodeId => {
          const node = ServerZwaveBatteryLevelTrigger.zwaveService.getNodeById(nodeId)
          if (node && node.batteryLevelGetRaw && !this.deviceStates[nodeId]) {
            const values = node.batteryLevelGetRaw()
            values.percent = node.batteryLevelGetPercent(values.instance)
            this.deviceStates[nodeId] = values // ok for node instance 1
          }
        })
      }, 3000)
    })
  }

  get name () {
    const way = (this.data.way === 'decreasing') ? '<' : '>'
    return this.data.name ? `Battery of ${this.data.name} ${way} ${this.data.limit}%` : `Misconfigured battery level trigger`
  }

  reschedule () {
    this.cancelEvents()
    if (this.listeners.filter((l) => !l.lazy).length === 0) {
      ServerZwaveBatteryLevelTrigger.logger.info(`Trigger ${this.data.name} has no active listener. Trigger unscheduled.`)
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
      this.sourceListener = (nodeId, oldValue, newValue) => {
        if (!this.data.nodeIds.includes(nodeId)) {
          return
        }

        // TODO !8: For later, rely on 2 or 3 samples to avoid reading errors triggering too much. Caution when not enough samples, must take sample time gaps into account!
        if (this.data.way === 'increasing' && oldValue <= this.data.limit && newValue > this.data.limit) {
          this.listeners.forEach((listener) => listener())
        }
        if (this.data.way === 'decreasing' && oldValue >= this.data.limit && newValue < this.data.limit) {
          this.listeners.forEach((listener) => listener())
        }
      }
      return Promise.resolve(true)
    } catch (error) {
      return Promise.reject(error)
    }
  }
}
