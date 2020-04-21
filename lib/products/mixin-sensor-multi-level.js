'use strict'

import { compileMean } from '../tools'

// Class ID 49 = 0x31 COMMAND_CLASS_SENSOR_MULTILEVEL
// Meter example: Fibaro wall plug instant energy (W)
const SensorMultiLevelSupport = (index, units) => (superClass) => class extends superClass {
  constructor (node, context) {
    super(node, context)
    this.node = node
    this.zwave = context.zwave
    this.logger = context.logger
    this.privateSocketIo = context.privateSocketIo
    this.dataHandler = context.dataHandler
    this.dataSensorMultiLevelKey = `zwave-node-${this.node.nodeid}-sensor-multi-level-data`

    this.dataSensorMultiLevel = []
    this.dataHandler.getItem(this.dataSensorMultiLevelKey)
    .then((data) => {
this.node.nodeid === 3 && this.logger.log('####1 z', data)
      this.dataSensorMultiLevel = data || []
    })
  }

// TODO !1: température du product door/window sensor: l'historique disparaît au fur et à mesure !
  _sensorMultiLevelStackData (value) {
    const v = value.value
    this.dataSensorMultiLevel.push({ t: Date.now(), v, i: value.instance || 1, m: v, M: v })
    while (this.dataSensorMultiLevel.length > 1024) {
      this.dataSensorMultiLevel.shift()
    }
this.node.nodeid === 3 && this.logger.log('####1 a', this.dataSensorMultiLevel)
    this.dataSensorMultiLevel = compileMean(this.dataSensorMultiLevel)
this.node.nodeid === 3 && this.logger.log('####1 b', this.dataSensorMultiLevel)
    this.dataHandler.setItem(this.dataSensorMultiLevelKey, this.dataSensorMultiLevel)
  }

  sensorMultiLevelGetValue (instance = 1) {
    return this.node.classes[49][index][instance].value
  }

  sensorMultiLevelGetHistory (instance = 1) {
    return this.dataSensorMultiLevel.filter((d) => d.i === instance)
  }

  sensorMultiLevelGetLabel (instance = 1) {
    return this.node.classes[49][index][instance].label
  }

  sensorMultiLevelGetUnits (instance = 1) {
    return units || this.node.classes[49][index][instance].units
  }

  sensorMultiLevelGetFormatted (instance = 1) {
    const values = this.node.classes[49][index][instance]
    return `${values.label}: ${values.value}${units || values.units}`
  }

  classValueChanged (comClass, value) {
    switch (comClass) {
      case 49: // 0x31
        if (value.index === index) {
          this.logger.info(`Node #${this.node.nodeid} sensor multi level: ${value.label}: ${value.value}${units || value.units}.`)
          this._sensorMultiLevelStackData(value)
          this.privateSocketIo.emit('node-event-sensor-multi-level-changed', this.node.nodeid, value)
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
  }
}

export default SensorMultiLevelSupport
