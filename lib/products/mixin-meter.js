'use strict'

const MeterSupport = (superClass) => class extends superClass {
  constructor (node, context) {
    super(node, context)
    this.node = node
    this.zwave = context.zwave
    this.logger = context.logger
    this.privateSocketIo = context.privateSocketIo

    this.data = []
  }

  _stackData (value) {
    this.data.push({ t: Date.now(), v: value.value, i: value.instance || 1 })
    while (this.data.length > 512) {
      this.data.shift()
    }
    // TODO !4: store in DB also? Then exploit them in an item.
  }

  mixinMeterResetCounter (instance = 1) {
    this.zwave.pressButton(this.node.nodeid, 50, instance, 33)
    setTimeout(() => { this.zwave.releaseButton(this.node.nodeid, 50, instance, 33) }, 1)
  }

  mixinMeterGetLastValue (instance = 1) {
    const dataForInstance = this.data.filter((d) => d.i === instance).reverse()
    return dataForInstance[0] || null
  }

  classValueChanged (comClass, value) {
    switch (comClass) {
      case 50:
        if (value.index === 0) {
          this.logger.info(`Node #${this.node.nodeid} meter at instance #${value.instance}, index #0: ${value.label} ${value.value}${value.units}.`)
          this._stackData(value)
          this.privateSocketIo.emit('node-event-meter-changed', this.node.nodeid, value)
        }
        if (value.index === 8) {
          this.logger.info(`Node #${this.node.nodeid} meter at instance #${value.instance}, index #8: ${value.label} ${value.value}${value.units}.`)
          // not used for now, mixin-sensor-multi-level can brings this data for tested device.
        }
        if (value.index === 32) {
          this.logger.info(`Node #${this.node.nodeid} meter at instance #${value.instance}, index #32: ${value.label} ${value.value}.`)
          // Exporting: For tested device, always false. Cannot understand what does it mean.
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
