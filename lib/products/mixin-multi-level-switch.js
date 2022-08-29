'use strict'

// class ID 38 = 0x26 COMMAND_CLASS_SWITCH_MULTILEVEL
// { minLevel, maxLevel } should be the same value for each support extension
const MultiLevelSwitchSupport = (instance, index, { minLevel, maxLevel }) => (superClass) => class extends superClass {
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

  multiLevelSwitchSetPercent (percent, instance = 1, index = 0) {
    const value = Math.round((maxLevel * percent / 100) + minLevel)
    this.zwave.setValue(this.node.nodeid, 38, instance, index, value)
  }

  multiLevelSwitchSetValue (value, instance = 1, index = 0) {
    if (value < minLevel) {
      value = minLevel
    }
    if (value > maxLevel) {
      value = maxLevel
    }
    this.zwave.setValue(this.node.nodeid, 38, instance, index, value)
  }

  multiLevelSwitchGetPercent (instance = 1, index = 0) {
    const value = this.node.classes[38][index][instance].value
    return (value - minLevel) * 100 / maxLevel
  }

  multiLevelSwitchGetValue (instance = 1, index = 0) {
    return this.node.classes[38][index][instance].value
  }

  classValueChanged (comClass, v) {
    switch (comClass) {
      case 38: // 0x26
        if (v.index === index && v.instance === instance) {
          this.logger.info(`Node #${this.node.nodeid} multi-level switch at instance #${instance}, index #${index}: ${v.value}.`)
          this.privateSocketIo.emit('node-event-multi-level-switch-changed', this.node.nodeid, v, instance, index)
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, v)
    }
  }
}

export default MultiLevelSwitchSupport
