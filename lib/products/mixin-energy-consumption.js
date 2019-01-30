'use strict'

import debounce from 'debounce'

// Need MeterSupport and SensorMultiLevelSupport mixins to be extended first
const EnergyConsumptionMeterSupport = (meterIndex = 0, instantEnergyInstance = 1, meterInstance = 1) => (superClass) => class extends superClass {
  constructor (node, context) {
    super(node, context)
    this.node = node
    this.zwave = context.zwave

    this.instantEnergyInstanceIndex = instantEnergyInstance
    this.meterInstanceIndex = meterInstance

    this.dataHandler = context.dataHandler
    this.scenariiService = context.scenariiService
    this.dataConsumptionMeterKey = `zwave-node-${this.node.nodeid}-consumption-meter-data`

    this.dataConsumptionMeter = []
    this.dataHandler.getItem(this.dataConsumptionMeterKey)
    .then((data) => {
      this.dataConsumptionMeter = data || []
    })

    this.debouncedRefreshConsumptionCall = debounce((value) => {
      this.zwave.refreshValue({ node_id: value.node_id, class_id: 50, instance: this.meterInstanceIndex, index: meterIndex })
    }, 60000, true)
  }

  // Should override MeterSupport _meterStackData()
  _meterStackData (value) {
    this.scenariiService.getEnergyPricing()
    .catch((error) => {
      console.warn('Energy pricing seems to be undefined. Must set it first!')
      return 0
    })
    .then((pricing) => {
      const lastConsumptionMeasure = this.dataConsumptionMeter.length > 0 ?
        this.dataConsumptionMeter[this.dataConsumptionMeter.length - 1] :
        { d: { v: 0, p: 0, c: 0 }, s: { v: 0, c: 0 } }

      const valueDelta = value.value - lastConsumptionMeasure.s.v
      if (valueDelta === 0) {
        return // no need to store a no-delta :)
      }

      const newConsumptionDelta = { v: valueDelta, p: pricing, c: valueDelta * pricing }

      this.dataConsumptionMeter.push({
        d: newConsumptionDelta,
        s: {
          v: lastConsumptionMeasure.s.v + newConsumptionDelta.v,
          c: lastConsumptionMeasure.s.c + newConsumptionDelta.c,
        }
      })

      while (this.dataConsumptionMeter.length > 1024) {
        this.dataConsumptionMeter.shift()
      }
      return this.dataHandler.setItem(this.dataConsumptionMeterKey, this.dataConsumptionMeter)
    })

    super._meterStackData(value)
  }

  // Should override SensorMultiLevelSupport _sensorMultiLevelStackData()
  _sensorMultiLevelStackData (value) {
    // Ask to refresh meter value (energy consumption meter) each time instant energy changes, but with 1 minute min interval.
    if (value.instance === this.instantEnergyInstanceIndex) {
      this.debouncedRefreshConsumptionCall(value)
    }
    super._sensorMultiLevelStackData(value)
  }

  // Should override MeterSupport meterResetCounter()
  meterResetCounter (instance = 1) {
    this.dataConsumptionMeter = []
    return this.dataHandler.setItem(this.dataConsumptionMeterKey, this.dataConsumptionMeter)
    .then(() => {
      super.meterResetCounter(instance)
      this.zwave.refreshValue({ node_id: this.node.nodeid, class_id: 50, instance: this.meterInstanceIndex, index: meterIndex })
    })
  }

  energyConsumptionMeterGetLastCost () {
    const data = this.dataConsumptionMeter.length > 0 ?
      this.dataConsumptionMeter[this.dataConsumptionMeter.length - 1] :
      { d: { v: 0, p: 0, c: 0 }, s: { v: 0, c: 0 } }
    return data.s.c || null
  }
}

export default EnergyConsumptionMeterSupport
