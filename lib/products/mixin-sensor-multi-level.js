'use strict'

const SensorMultiLevelSupport = (superClass) => class extends superClass {
  constructor (node, context) {
    super(node, context)
    this.node = node
    this.zwave = context.zwave
    this.logger = context.logger
    this.privateSocketIo = context.privateSocketIo

    this.data = []
  }

  _stackData (value) {
    this.data.push({ t: Date.now(), v: value.value })
    while (this.data.length > 512) {
      this.data.shift()
    }
    // TODO !4: store in DB also? Then exploit them in an item.
  }

  sensorMultiLevelGetValue (instance = 1) {
    return this.node.classes[49][4][instance].value
  }

  sensorMultiLevelGetLabel (instance = 1) {
    return this.node.classes[49][4][instance].label
  }

  sensorMultiLevelGetUnits (instance = 1) {
    return this.node.classes[49][4][instance].units
  }

  sensorMultiLevelGetFormatted (instance = 1) {
    const values = this.node.classes[49][4][instance]
    return `${values.label}: ${values.value}${values.units}`
  }

  classValueChanged (comClass, value) {
    switch (comClass) {
      case 49: // 0x31
        if (value.index === 4) {
          this.logger.info(`Node #${this.node.nodeid} sensor multi level: ${value.label}: ${value.value}${value.units}.`)
          this._stackData(value)
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
