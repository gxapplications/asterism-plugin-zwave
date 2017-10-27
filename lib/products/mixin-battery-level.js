'use strict'

// class ID 128 = 0x80 COMMAND_CLASS_BATTERY
const BatteryLevelSupport = (index, { minLevel, maxLevel }, { lowBatteryAlarmIndex, alarmCondition } = {}) => (superClass) => class extends superClass {
  constructor (node, context) {
    super(node, context)
    this.node = node
    this.zwaveService = context.zwaveService
    this.logger = context.logger
    this.privateSocketIo = context.privateSocketIo
  }

  batteryLevelGetRaw (instance = 1) {
    return (this.node.classes[128] && this.node.classes[128][index][instance].value !== undefined) ? (this.node.classes[128] && this.node.classes[128][index][instance].value) || -1 : -1
  }

  batteryLevelGetMin (instance = 1) {
    return minLevel || (this.node.classes[128] && this.node.classes[128][index][instance].min) || 0
  }

  batteryLevelGetMax (instance = 1) {
    return maxLevel || (this.node.classes[128] && this.node.classes[128][index][instance].max) || 100
  }

  batteryLevelGetPercent (instance = 1) {
    const min = this.batteryLevelGetMin(instance)
    const max = this.batteryLevelGetMax(instance) - min
    return (this.batteryLevelGetRaw(instance) - min) * 100 / max
  }

  batteryLevelGetIcon (instance = 1) {
    const level = this.batteryLevelGetPercent(instance)
    if (level >= 95) {
      return 'battery_full'
    }
    if (level >= 85) {
      return 'battery_90'
    }
    if (level >= 70) {
      return 'battery_80'
    }
    if (level >= 55) {
      return 'battery_60'
    }
    if (level >= 40) {
      return 'battery_50'
    }
    if (level >= 25) {
      return 'battery_30'
    }
    if (level >= 10) {
      return 'battery_20'
    }
    if (level >= 0) {
      return 'battery_alert'
    }
    return 'battery_unknown'
  }

  classValueChanged (comClass, value) {
    switch (comClass) {
      case 113: // 0x71 COMMAND_CLASS_ALARM
        if (lowBatteryAlarmIndex !== undefined && value.index === lowBatteryAlarmIndex && (
            (alarmCondition && alarmCondition(value.value)) || (!alarmCondition && value.value > 0)
          )) {
          this.logger.warn(`Node #${this.node.nodeid} battery level is too low. Needs replacement.`)
          this.privateSocketIo.emit('node-event-battery-level-too-low', this.node.nodeid, value)

          // must notice zwave service too, for notification icon and alarms list update
          this.zwaveService.updateAlarmsToNotify([
            { node: this.node, status: [true, 'Battery is low'], value }
          ])
        }
        if (lowBatteryAlarmIndex !== undefined && value.index === lowBatteryAlarmIndex && (
            (alarmCondition && !alarmCondition(value.value)) || (!alarmCondition && (value.value === 0 || value.value === 254))
          )) {
          // must notice zwave service too, for notification icon and alarms list update
          this.zwaveService.updateAlarmsToNotify([
            { node: this.node, status: [false, 'Battery is low'], value }
          ])
        }
        break
      case 128: // 0x80 COMMAND_CLASS_BATTERY
        if (value.index === index) {
          this.logger.info(`Node #${this.node.nodeid} battery level is ${value.value}/${value.max}.`)
          this.privateSocketIo.emit('node-event-battery-level-changed', this.node.nodeid, value)
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
  }
}

export default BatteryLevelSupport
