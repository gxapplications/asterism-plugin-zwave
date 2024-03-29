'use strict'

// Class ID 113 = 0x71 COMMAND_CLASS_ALARM
// configurations: an object indexed by cmdClass indexes that need to emit an event. as indexed value, a filter
// to transform cmdClass value into another value to emit, or null to avoid emitting the event.
const AlarmSupport = (configurations) => (superClass) => class extends superClass {
  // FIXME: for now supports only instance = 1 case!
  constructor (node, context) {
    super(node, context)
    this.node = node
    this.zwaveService = context.zwaveService
    this.dataHandler = context.dataHandler
    this.logger = context.logger
    this.privateSocketIo = context.privateSocketIo
    this.dataAlarmLastStatesKey = `zwave-node-${this.node.nodeid}-alarm-last-states-data`
    this.dataAlarmStatesHistoryKey = `zwave-node-${this.node.nodeid}-alarm-states-history-data`

    this.states = {}
    this.statesHistory = []

    this.dataHandler.getItem(this.dataAlarmLastStatesKey)
    .then((data) => {
      this.states = data || this.states

      // Refresh values from zwave network
      Object.assign(this.states, ...Object.keys(configurations).map(
        (index) => {
          const value = this.node.classes[113]?.[index]?.['1']?.value
          const label = value ? this.alarmGetLabelForValue(index, value) : null
          return label ? { [index]: label } : {}
        }
      ))
    })
    .then(() => this._alarmStatesInitialized())

    this.dataHandler.getItem(this.dataAlarmStatesHistoryKey)
    .then((data) => {
      this.statesHistory = data || this.statesHistory
    })
  }

  // Usefull to override if need to do job when states are up to date.
  _alarmStatesInitialized () {}

  alarmGetLabelForValue (index, value) {
    const filter = configurations[index]
    if (!filter) {
      return undefined
    }
    return filter(value)
  }

  alarmGetLastLabel (index) {
    return this.states[`${index}`]
  }

  alarmGetLabelHistory (index) {
    if (index === undefined) {
      return this.statesHistory
    }
    return this.statesHistory.filter((history) => history.index === index)
  }

  alarmGetSupportedLabels () {
    return configurations.map((i) => i.description)
  }

  alarmIsOn (index) {
    const lastLabel = this.alarmGetLastLabel(index)
    return (lastLabel && lastLabel.length > 0 && lastLabel[1] === configurations[parseInt(index, 10)].description.shortLabel) ? lastLabel[0] : undefined
  }

  alarmGetMuteIndex (index) {
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => (item?.mutedAlarm && item.mutedAlarm[index] || false))
    .catch(console.error)
  }

  alarmSetMuteIndex (index, mute) {
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      item.mutedAlarm = item.mutedAlarm || {}
      item.mutedAlarm[index] = mute
      return item
    })
    .then((item) => this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item))
    .catch(console.error)
  }

  classValueChanged (comClass, value) {
    switch (comClass) {
      case 113: // 0x71
        const filter = configurations[value.index]
        if (filter !== undefined) {
          const filtered = filter(value.value)
          if (filtered !== null) {
            try {
              if (filtered[0] === true) {
                this.logger.warn(`Node #${this.node.nodeid} alarm triggered: ${value.value} -> {${filtered.toString()}}.`)
              } else {
                this.logger.info(`Node #${this.node.nodeid} alarm ended: ${value.value} -> {${filtered.toString()}}.`)
              }
            } catch (err) {
              this.logger.warn(`Node #${this.node.nodeid} alarm triggered/ended: ${value.value}.`)
            }

            this.privateSocketIo.emit('node-event-alarm-triggered', this.node.nodeid, filtered)

            this.alarmGetMuteIndex(value.index)
            .then((shouldMuteAlarmIndex) => {
              if (shouldMuteAlarmIndex) {
                this.logger.info(`Node #${this.node.nodeid} alarm for index ${value.value} is muted. Ignored.`)
                return
              }

              // must notice zwave service too, for notification icon and alarms list update
              this.zwaveService.updateAlarmsToNotify([
                { node: this.node, status: [...filtered], value } // copy filtered, because service will modify it
              ])

              this.states[`${value.index}`] = filtered
              this.dataHandler.setItem(this.dataAlarmLastStatesKey, this.states)

              this.statesHistory.push({ date: new Date().getTime(), index: value.index, value: filtered })
              while (this.statesHistory.length > 64) {
                this.statesHistory.shift()
              }
              this.dataHandler.setItem(this.dataAlarmStatesHistoryKey, this.statesHistory)
            })
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

export default AlarmSupport
