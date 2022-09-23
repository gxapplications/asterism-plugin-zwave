'use strict'

// class ID 37 = 0x25 COMMAND_CLASS_SWITCH_BINARY
const BinarySwitchSupport = (instance, index) => (superClass) => class extends superClass {
  constructor (node, context) {
    super(node, context)
    this.node = node
    this.zwave = context.zwave
    this.logger = context.logger
    this.privateSocketIo = context.privateSocketIo

    this.supportedInstances = this.supportedInstances || []
    this.supportedInstances.push(instance)
    this._debouncedValue = this._debouncedValue || {}
    this._debouncedValue[`${instance}-${index}`] = { v: null, t: 0 }
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
          const debouncedValue = this._debouncedValue[`${value.instance}-${value.index}`]
          if ((Date.now() > (debouncedValue.t + 500)) || (value.value !== debouncedValue.v)) {
            this.logger.info(`Node #${this.node.nodeid} binary switch at instance #${instance} is ${value.value ? 'ON' : 'OFF'}.`)
            this.privateSocketIo.emit('node-event-binary-switch-changed', this.node.nodeid, value)

            debouncedValue.v = value.value
            debouncedValue.t = Date.now()
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
