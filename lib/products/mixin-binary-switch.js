'use strict'

// class ID 37 = 0x25 COMMAND_CLASS_SWITCH_BINARY
const BinarySwitchSupport = (instance, index, forcePolling = false) => (superClass) => class extends superClass {
  constructor (node, context) {
    super(node, context)
    this.node = node
    this.zwave = context.zwave
    this.logger = context.logger
    this.privateSocketIo = context.privateSocketIo

    this.supportedInstances = this.supportedInstances || []
    this.supportedInstances.push(instance)

    if (forcePolling) {
      // Useful only for devices that does not returns changes automatically
      this.zwave.enablePoll(this.node.classes[37][index][instance], 1)
      this.logger.log(`Node #${this.node.nodeid} comClass #37 (0x25) index #${index} instance #${instance}: poll enabled.`)
      this.forcedPollingValues = this.forcedPollingValues || {}
      this.forcedPollingValues[`${index}-${instance}`] = null
    }
  }

  binarySwitchGetSupportedInstances () {
    return this.supportedInstances
  }

  binarySwitchTurnOn (instance = 1) {
    this.binarySwitchTurnOnOff(true, instance)
  }

  binarySwitchTurnOff (instance = 1) {
    this.binarySwitchTurnOnOff(false, instance)
  }

  binarySwitchTurnOnOff (onOff, instance = 1) {
    this.zwave.setValue(this.node.nodeid, 37, instance, index, !!onOff)
  }

  binarySwitchInvert (instance = 1) {
    const state = this.binarySwitchGetState(instance)
    this.zwave.setValue(this.node.nodeid, 37, instance, index, !state)
  }

  binarySwitchGetState (instance = 1) {
    return this.node.classes[37][index][instance].value
  }

  classValueChanged (comClass, value) {
    switch (comClass) {
      case 37: // 0x25
        if (value.index === index && value.instance === instance) {
          if (!this.forcedPollingValues || this.forcedPollingValues[`${value.index}-${value.instance}`] === undefined) {
            this.logger.info(`Node #${this.node.nodeid} binary switch at instance ${instance} is ${value.value ? 'ON' : 'OFF'}.`)
            this.privateSocketIo.emit('node-event-binary-switch-changed', this.node.nodeid, value)
          } else {
            // Manual poll mode: trigger change only if value.value changed
            const oldPolledValue = this.forcedPollingValues[`${value.index}-${value.instance}`]
            if (oldPolledValue !== null && oldPolledValue.value !== value.value) {
              this.logger.info(`Node #${this.node.nodeid} binary switch at instance ${instance} is ${value.value ? 'ON' : 'OFF'}!`)
              this.privateSocketIo.emit('node-event-binary-switch-changed', this.node.nodeid, value)
            }
            this.forcedPollingValues[`${value.index}-${value.instance}`] = value
          }
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
  }
}

export default BinarySwitchSupport
