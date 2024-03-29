'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerTrigger } = Scenarii

export default class ServerZwaveEnergyConsumptionLimitTrigger extends ServerTrigger {
  constructor (data) {
    super(data)
    this.sourceListener = null
    this.deviceStates = {}
    this.deviceCosts = {}

    // This is a permanent listener, but will filter on comClass 49 (sensor multi level). Do not rely on this.data that can change...
    ServerZwaveEnergyConsumptionLimitTrigger.zwaveService.context.zwave.on('value changed', (nodeId, comClass, values) => {
      if (comClass === 50 && values.index === 0) {
        if (this.sourceListener && this.deviceStates[nodeId] && (
                this.deviceStates[nodeId].value !== values.value
                || this.deviceStates[nodeId].instance !== values.instance
            )) {

          if (this.data.unit === 'cost') {
            const node = ServerZwaveEnergyConsumptionLimitTrigger.zwaveService.getNodeById(nodeId)
            const cost = node.energyConsumptionMeterGetLastCost()
            if (cost > 0 && this.deviceCosts[nodeId] !== cost) {
              this.sourceListener(nodeId, this.deviceCosts[nodeId], cost)
            }
            this.deviceCosts[nodeId] = cost
          } else {
            this.sourceListener(nodeId, this.deviceStates[nodeId].value, values.value)
          }
        }
        this.deviceStates[nodeId] = values
      }
    })

    // init values when zwave network is ready
    ServerZwaveEnergyConsumptionLimitTrigger.zwaveService.context.zwave.on('scan complete', () => {
      setTimeout(() => {
        const node = ServerZwaveEnergyConsumptionLimitTrigger.zwaveService.getNodeById(this.data.nodeId)
        if (node && node.meterGetLastValue && !this.deviceStates[this.data.nodeId]) {
          this.deviceStates[this.data.nodeId] = node.meterGetLastValue() // ok for node instance 1
        }
        if (node && node.energyConsumptionMeterGetLastCost && !this.deviceCosts[this.data.nodeId]) {
          this.deviceCosts[this.data.nodeId] = node.energyConsumptionMeterGetLastCost() // ok for node instance 1
        }
      }, 3000)
    })
  }

  get name () {
    return this.data.name ? `Energy consumption of ${this.data.name}` : `Misconfigured energy consumption limit trigger on node #${this.data.nodeId}`
  }

  reschedule () {
    this.cancelEvents()
    if (this.listeners.filter((l) => !l.lazy).length === 0) {
      ServerZwaveEnergyConsumptionLimitTrigger.logger.info(`Trigger ${this.data.name} has no active listener. Trigger unscheduled.`)
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
        if (oldValue <= this.data.limit && newValue > this.data.limit) {
          this.listeners.forEach((listener) => listener())
        }
      }
      return Promise.resolve(true)
    } catch (error) {
      return Promise.reject(error)
    }
  }
}
