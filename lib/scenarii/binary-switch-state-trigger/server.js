'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerTrigger } = Scenarii

export default class ServerZwaveBinarySwitchStateTrigger extends ServerTrigger {
  nodesList () {
    return this.data.nodes.map(({ id, instance }) => instance > 1 ? `${id}(${instance})` : id).join(',')
  }

  constructor (data) {
    super(data)
    this.sourceListener = null
    this.deviceStates = {}

    // This is a permanent listener, but will filter on comClass 37 (binary switch control). Do not rely on this.data that can change...
    ServerZwaveBinarySwitchStateTrigger.zwaveService.context.zwave.on('value changed', (nodeId, comClass, values) => {
      if (comClass === 37) {
        if (this.sourceListener && this.deviceStates[nodeId] && (
            this.deviceStates[nodeId].value !== values.value
            || this.deviceStates[nodeId].instance !== values.instance
            || this.deviceStates[nodeId].index !== values.index
          )) {
          this.sourceListener(nodeId, values.value)
        }
        this.deviceStates[nodeId] = values
      }
    })

    // init values when zwave network is ready
    ServerZwaveBinarySwitchStateTrigger.zwaveService.context.zwave.on('scan complete', () => {
      setTimeout(() => {
        this.data.nodes.forEach(({ id }) => {
          const node = ServerZwaveBinarySwitchStateTrigger.zwaveService.getNodeById(id)
          if (node && node.binarySwitchGetState && !this.deviceStates[id]) {
            this.deviceStates[id] = node.binarySwitchGetState() // ok for node instance 1
          }
        })
      }, 3000)
    })
  }

  get name () {
    const defaultName = `Misconfigured switch state trigger on nodes ${this.nodesList()}`
    switch (this.data.event) {
      case 'inverted':
      default:
        return this.data.name ? `Switch ${this.data.name} inverted` : defaultName
      case 'turned-on':
        return this.data.name ? `Switch ${this.data.name} turned ON` : defaultName
      case 'turned-off':
        return this.data.name ? `Switch ${this.data.name} turned OFF` : defaultName
    }
  }

  reschedule () {
    this.cancelEvents()
    if (this.listeners.filter((l) => !l.lazy).length === 0) {
      ServerZwaveBinarySwitchStateTrigger.logger.info(`Trigger ${this.data.name} has no active listener. Trigger unscheduled.`)
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
      this.sourceListener = (nodeId, value) => {
        if ((value === true && this.data.event === 'turned-off') || (value === false && this.data.event === 'turned-on')) {
          return
        }
        if (this.data.nodes.map(({ id }) => id).includes(nodeId)) {
          this.listeners.forEach((listener) => listener())
        }
      }
      return Promise.resolve(true)
    } catch (error) {
      return Promise.reject(error)
    }
  }
}
