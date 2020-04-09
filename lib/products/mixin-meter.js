'use strict'

import { compileMean, compileTruncate } from '../tools'

// Class ID 50 = 0x32 COMMAND_CLASS_METER
// Meter example: Fibaro wall plug consumption (kWh)
const MeterSupport = (index) => (superClass) => class extends superClass {
  constructor (node, context) {
    super(node, context)
    this.node = node
    this.zwave = context.zwave
    this.logger = context.logger
    this.privateSocketIo = context.privateSocketIo
    this.dataHandler = context.dataHandler
    this.dataMeterKey = `zwave-node-${this.node.nodeid}-sensor-meter-data`

    this.dataMeter = []
    this.dataHandler.getItem(this.dataMeterKey)
    .then((data) => {
      this.dataMeter = data || []
    })
  }

  _meterStackData (value) {
    const v = value.value
    this.dataMeter.push({ t: Date.now(), v, i: value.instance || 1 })
    while (this.dataMeter.length > 1024) {
      this.dataMeter.shift()
    }
    this.dataMeter = compileTruncate(this.dataMeter)

    this.dataHandler.setItem(this.dataMeterKey, this.dataMeter)
    // TODO !0.5: Exploit data in an item.
  }

  meterResetCounter (instance = 1) {
    this.zwave.pressButton(this.node.nodeid, 50, instance, 257)
    setTimeout(() => { this.zwave.releaseButton(this.node.nodeid, 50, instance, 257) }, 1)
  }

  meterGetLastValue (instance = 1) {
    const dataForInstance = this.dataMeter.filter((d) => d.i === instance).reverse()
    return dataForInstance[0] || null
  }

  meterGetAllValues (instance = 1) {
    return this.dataMeter.filter((d) => d.i === instance)
  }

  meterGetUnits (instance = 1) {
    return this.node.classes[50][index][instance].units
  }

  classValueChanged (comClass, value) {
    switch (comClass) {
      case 50:
        if (value.index === index) {
          this.logger.info(`Node #${this.node.nodeid} meter at instance #${value.instance}, index #${index}: ${value.label} ${value.value}${value.units}.`)
          this._meterStackData(value)
          this.privateSocketIo.emit('node-event-meter-changed', this.node.nodeid, value)
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
  }

}

export default MeterSupport
