'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerTrigger } = Scenarii

export default class ServerZwaveInstantEnergyLimitTrigger extends ServerTrigger {
  constructor (data) {
    super(data)
    this.sourceListener = null
    this.deviceStates = {}

    // This is a permanent listener, but will filter on comClass 49 (sensor multi level). Do not rely on this.data that can change...
    ServerZwaveInstantEnergyLimitTrigger.zwaveService.context.zwave.on('value changed', (nodeId, comClass, values) => {
      if (comClass === 49 && values.index === 4) {
        if (this.sourceListener && this.deviceStates[nodeId] && (
                this.deviceStates[nodeId].value !== values.value
                || this.deviceStates[nodeId].instance !== values.instance
            )) {
          this.sourceListener(nodeId, this.deviceStates[nodeId].value, values.value)
        }
        this.deviceStates[nodeId] = values
      }
    })

    // init values when zwave network is ready
    ServerZwaveInstantEnergyLimitTrigger.zwaveService.context.zwave.on('scan complete', () => {
      setTimeout(() => {
        const node = ServerZwaveInstantEnergyLimitTrigger.zwaveService.getNodeById(this.data.nodeId)
        if (node && node.sensorMultiLevelGetValue && !this.deviceStates[this.data.nodeId]) {
          this.deviceStates[this.data.nodeId] = node.sensorMultiLevelGetValue() // ok for node instance 1
        }
      }, 3000)
    })
  }

  get name () {
    const way = (this.data.way === 'decreasing') ? '<' : '>'
    return this.data.name ? `Power of ${this.data.name} ${way} ${this.data.limit}W` : `Misconfigured power limit trigger on node #${this.data.nodeId}`
  }

  reschedule () {
    this.cancelEvents()
    if (this.listeners.filter((l) => !l.lazy).length === 0) {
      ServerZwaveInstantEnergyLimitTrigger.logger.info(`Trigger ${this.data.name} has no active listener. Trigger unscheduled.`)
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
        if (this.data.nodeId !== nodeId) {
          return
        }

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
