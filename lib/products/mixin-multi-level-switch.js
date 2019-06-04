'use strict'

// class ID 38 = 0x26 COMMAND_CLASS_SWITCH_MULTILEVEL
const MultiLevelSwitchSupport = (instance, index, { minLevel, maxLevel }) => (superClass) => class extends superClass {
  constructor (node, context) {
    super(node, context)
    this.node = node
    this.zwave = context.zwave
    this.logger = context.logger
    this.privateSocketIo = context.privateSocketIo

    /* Useful only for devices that does not returns changes automatically
    for (var index in this.node.classes[37]) {
      for (var instance in this.node.classes[37][index]) {
        this.zwave.enablePoll(this.node.classes[37][index][instance], 1)
        this.logger.log(`Node #${this.node.nodeid} comClass #37 (0x25) index #${index} instance #${instance}: poll enabled.`)
      }
    } */
  }

  multiLevelSwitchSetPercent (percent, instance = 1) {
    const value = Math.round((maxLevel * percent / 100) + minLevel)
    this.zwave.setValue(this.node.nodeid, 38, instance, index, value)
  }

  multiLevelSwitchSetValue (value, instance = 1) {
    if (value < minLevel) {
      value = minLevel
    }
    if (value > maxLevel) {
      value = maxLevel
    }
    this.zwave.setValue(this.node.nodeid, 38, instance, index, value)
  }

  multiLevelSwitchGetPercent (instance = 1) {
    const value = this.node.classes[38][index][instance].value
    return (value - minLevel) * 100 / maxLevel
  }

  multiLevelSwitchGetValue (instance = 1) {
    return this.node.classes[38][index][instance].value
  }

  classValueChanged (comClass, value) {
    switch (comClass) {
      case 38: // 0x26
        if (value.index === index && value.instance === instance) {
          this.logger.info(`Node #${this.node.nodeid} multi-level switch at instance ${instance} is ${value.value}.`)
          this.privateSocketIo.emit('node-event-multi-level-switch-changed', this.node.nodeid, value, instance, index)
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
  }
}

export default MultiLevelSwitchSupport
