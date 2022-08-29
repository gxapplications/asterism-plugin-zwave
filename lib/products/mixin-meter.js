'use strict'

import { compileTruncate } from '../tools'

// Class ID 50 = 0x32 COMMAND_CLASS_METER
// Meter example: Fibaro wall plug consumption (kWh)
const MeterSupport = (instance, index) => (superClass) => class extends superClass {
  constructor (node, context) {
    super(node, context)
    this.node = node
    this.zwave = context.zwave
    this.logger = context.logger
    this.privateSocketIo = context.privateSocketIo
    this.dataHandler = context.dataHandler
    this.dataMeterKey = `zwave-node-${this.node.nodeid}-sensor-meter-data`

    this.dataMeter = null
    this.dataHandler.getItem(this.dataMeterKey)
    .then((data) => {
      this.dataMeter = (data || []).concat(this.dataMeter || [])
    })

    this._meterDataFilters = this._meterDataFilters || []
    this._meterDataFilters[`${instance}-${index}`] = (d) => {
      const inst = ((instance === 1) && (d.i === 1 || d.i === undefined)) // test 1 or undefined (backward compat)
          || ((instance !== 1) && (d.i === instance))
      return (index === 0)
          ? inst && d.x === undefined
          : inst && d.x === index
    }
  }

  _meterStackData (value) {
    const data = { t: Date.now(), v: value.value }
    if (value.instance !== 1) { // when instance 1, no data stored (optim)
      data.i = value.instance
    }
    if (value.index !== 0) { // when index 0, no data stored (optim)
      data.x = value.index
    }

    if (this.dataMeter === null) {
      this.dataMeter = [data]
      return // Cannot compute data, getter in constructor has not responded yet!
    }

    this.dataMeter.push(data)
    if (this.dataMeter.length > 700) { // 1024 causes overflows in db rows
      this.dataMeter = this.dataMeter.slice(-700)
    }
    this.dataMeter = compileTruncate(this.dataMeter)
    this.dataHandler.setItem(this.dataMeterKey, this.dataMeter)
  }

  meterResetCounter (instance = 1) {
    this.zwave.pressButton(this.node.nodeid, 50, instance, 257)
    setTimeout(() => { this.zwave.releaseButton(this.node.nodeid, 50, instance, 257) }, 1)
  }

  meterGetLastValue (instance = 1, index = 0) {
    return this.dataMeter.filter(this._meterDataFilters[`${instance}-${index}`]).pop() || null
  }

  meterGetAllValues (instance = 1, index = 0) {
    return this.dataMeter.filter(this._meterDataFilters[`${instance}-${index}`])
  }

  meterGetLabel (instance = 1, index = 0) {
    return this.node.classes[50][index][instance].label
  }

  meterGetUnits (instance = 1, index = 0) {
    return this.node.classes[50][index][instance].units
  }

  meterGetFormatted (instance = 1, index = 0) {
    const values = this.node.classes[50][index][instance]
    return `${values.label}: ${values.value}${values.units}`
  }

  classValueChanged (comClass, v) {
    switch (comClass) {
      case 50:
        if (v.index === index && v.instance === instance) {
          this.logger.info(`Node #${this.node.nodeid} meter at instance #${instance}, index #${index}: ${v.label} ${v.value}${v.units}.`)
          this._meterStackData(v)
          this.privateSocketIo.emit('node-event-meter-changed', this.node.nodeid, v, instance, index)
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, v)
    }
  }

}

export default MeterSupport
