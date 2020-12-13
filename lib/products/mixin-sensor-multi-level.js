'use strict'

import { compileMean } from '../tools'

// Class ID 49 = 0x31 COMMAND_CLASS_SENSOR_MULTILEVEL
// Meter example: Fibaro wall plug instant energy (W) or temperature sensor (°C)
const SensorMultiLevelSupport = (index, units) => (superClass) => class extends superClass {
  constructor (node, context) {
    super(node, context)
    this.node = node
    this.zwave = context.zwave
    this.logger = context.logger
    this.privateSocketIo = context.privateSocketIo
    this.dataHandler = context.dataHandler
    this.scenariiService = context.scenariiService

    this.dataSensorMultiLevelKey = `zwave-node-${this.node.nodeid}-sensor-multi-level-data`
    this.dataSensorMultiLevel = null
    this.dataHandler.getItem(this.dataSensorMultiLevelKey)
      .then((data) => {
        this.dataSensorMultiLevel = (data || []).concat(this.dataSensorMultiLevel || [])
        if (this.dataSensorMultiLevel.length > 0) {
          this.sensorMultiLevelUpdateState(
            this.dataSensorMultiLevel[this.dataSensorMultiLevel.length - 1].v
          )
        }
      })
  }

  _sensorMultiLevelStackData (value) {
    const v = value.value

    if (this.dataSensorMultiLevel === null) {
      this.dataSensorMultiLevel = [{ t: Date.now(), v, i: value.instance || 1, m: v, M: v }]
      return // Cannot compute data, getter in constructor has not responded yet!
    }

    this.dataSensorMultiLevel.push({ t: Date.now(), v, i: value.instance || 1, m: v, M: v })
    while (this.dataSensorMultiLevel.length > 1024) {
      this.dataSensorMultiLevel.shift()
    }
    this.dataSensorMultiLevel = compileMean(this.dataSensorMultiLevel)
    this.dataHandler.setItem(this.dataSensorMultiLevelKey, this.dataSensorMultiLevel)
  }

  sensorMultiLevelGetValue (instance = 1) {
    return this.node.classes[49][index][instance].value
  }

  sensorMultiLevelGetHistory (instance = 1) {
    return (this.dataSensorMultiLevel || []).filter((d) => d.i === instance)
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
          this.sensorMultiLevelUpdateState(value.value)
          this.privateSocketIo.emit('node-event-sensor-multi-level-changed', this.node.nodeid, value)
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
  }

  sensorMultiLevelSetStateId (floatingLevelStateId) {
    this.node.sensorMultiLevelStateId = floatingLevelStateId
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
      .then((item) => {
        if (!item) {
          item = {}
        }
        item.sensorMultiLevelStateId = floatingLevelStateId
        return item
      })
      .then((item) => this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item))
      .then(() => {
        if (this.dataSensorMultiLevel && this.dataSensorMultiLevel.length > 0) {
          this.sensorMultiLevelUpdateState(
            this.dataSensorMultiLevel[this.dataSensorMultiLevel.length - 1].v
          )
        }
      })
      .catch(console.error)
  }

  sensorMultiLevelGetStateId () {
    if (this.node.sensorMultiLevelStateId) {
      return Promise.resolve(this.node.sensorMultiLevelStateId)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
      .then((item) => {
        if (item) {
          this.node.sensorMultiLevelStateId = item.sensorMultiLevelStateId
          return item.sensorMultiLevelStateId
        }
        return null
      })
      .catch(console.error)
  }

  sensorMultiLevelUpdateState (value) {
    return this.sensorMultiLevelGetStateId()
      .then((sensorMultiLevelStateId) => {
        if (sensorMultiLevelStateId === null) {
          return
        }

        return this.scenariiService.getStateInstance(sensorMultiLevelStateId)
          .then((floatingLevelState) => {
            if (!floatingLevelState) {
              return
            }

            // TODO !1: clean, then put a listener with preValidate to FORCE state from product
            /*
            if (this._forceLevelStateListenerId) {
              floatingLevelState.removeListener(this._forceLevelStateListenerId)
            }
            const listener = (state, s, oldState) => {}
            listener.preValidate = (state, s, oldState) => {
              return state === value
            }
            this._forceLevelStateListenerId = floatingLevelState.addListener(listener)
            */
            // TODO !1: update this state to value (need a conversion?).
            //floatingLevelState.state = value
          })
      })
  }
}

export default SensorMultiLevelSupport
