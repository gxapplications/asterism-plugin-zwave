'use strict'

import { compileMean } from '../tools'

// Class ID 49 = 0x31 COMMAND_CLASS_SENSOR_MULTILEVEL
// Meter example: Fibaro wall plug instant energy (W) or temperature sensor (°C)
const SensorMultiLevelSupport = (instance, index, units) => (superClass) => class extends superClass {
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

    this._forceSensorLevelStateListenerId = null
    this._sensorMultiLevelDataFilters = this._sensorMultiLevelDataFilters || []
    this._sensorMultiLevelDataFilters[`${instance}-${index}`] = (d) => {
      const inst = ((instance === 1) && (d.i === 1 || d.i === undefined)) // test 1 or undefined (backward compat)
        || ((instance !== 1) && (d.i === instance))
      return (index === 0)
        ? inst && d.x === undefined
        : inst && d.x === index
    }
  }

  _sensorMultiLevelStackData (value) {
    const data = { t: Date.now(), v: value.value, m: value.value, M: value.value }
    if (value.instance !== 1) { // when instance 1, no data stored (optim)
      data.i = value.instance
    }
    if (value.index !== 0) { // when index 0, no data stored (optim)
      data.x = value.index
    }

    if (this.dataSensorMultiLevel === null) {
      this.dataSensorMultiLevel = [data]
      return // Cannot compute data, getter in constructor has not responded yet!
    }

    this.dataSensorMultiLevel.push(data)
    if (this.dataSensorMultiLevel.length > 500) { // 1024 causes overflows in db rows
      this.dataSensorMultiLevel = this.dataSensorMultiLevel.slice(-500)
    }
    this.dataSensorMultiLevel = compileMean(this.dataSensorMultiLevel)
    this.dataHandler.setItem(this.dataSensorMultiLevelKey, this.dataSensorMultiLevel)
  }

  sensorMultiLevelGetValue (instance = 1, forceIndex = index) {
    return this.node.classes[49][forceIndex][instance].value
  }

  sensorMultiLevelGetHistory (instance = 1, forceIndex = index) {
    return (this.dataSensorMultiLevel || []).filter(this._sensorMultiLevelDataFilters[`${instance}-${forceIndex}`])
  }

  sensorMultiLevelGetLabel (instance = 1, forceIndex = index) {
    return this.node.classes[49][forceIndex][instance].label
  }

  sensorMultiLevelGetUnits (instance = 1, forceIndex = index) {
    return units || this.node.classes[49][forceIndex][instance].units
  }

  sensorMultiLevelGetFormatted (instance = 1, forceIndex = index) {
    const values = this.node.classes[49][forceIndex][instance]
    return `${values.label}: ${values.value}${units || values.units}`
  }

  classValueChanged (comClass, v) {
    switch (comClass) {
      case 49: // 0x31
        if (v.index === index && v.instance === instance) {
          this.logger.info(`Node #${this.node.nodeid} sensor multi level at instance #${instance}, index #${index}: ${v.label}: ${v.value}${units || v.units}.`)
          this._sensorMultiLevelStackData(v)
          this.sensorMultiLevelUpdateState(v.value)
          this.privateSocketIo.emit('node-event-sensor-multi-level-changed', this.node.nodeid, v, instance, index)
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, v)
    }
  }

  sensorMultiLevelSetStateId (floatingLevelStateId) {
    // remove old one case, if unlink
    if (this.node.sensorMultiLevelStateId && !floatingLevelStateId && this._forceSensorLevelStateListenerId) {
      this.scenariiService.getStateInstance(this.node.sensorMultiLevelStateId)
        .then((oldFloatingLevelState) => {
          oldFloatingLevelState.removeListener(this._forceSensorLevelStateListenerId)
          this._forceSensorLevelStateListenerId = null
        })
    }

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
        if (sensorMultiLevelStateId === null || sensorMultiLevelStateId === undefined || sensorMultiLevelStateId === '') {
          return
        }

        return this.scenariiService.getStateInstance(sensorMultiLevelStateId)
          .then((floatingLevelState) => {
            if (!floatingLevelState) {
              return
            }

            value = parseFloat(value)

            if (this._forceSensorLevelStateListenerId) {
              floatingLevelState.removeListener(this._forceSensorLevelStateListenerId)
            }
            const listener = (state, s, oldState) => {}
            listener.preValidate = (state, s, oldState) => {
              if (!listener.parent || !listener.parent._forceSensorLevelStateListenerId) {
                s.removeListener(listener.selfId)
                return true
              }
              return state === value
            }
            this._forceSensorLevelStateListenerId = floatingLevelState.addListener(listener)
            listener.parent = this
            listener.selfId = this._forceSensorLevelStateListenerId

            floatingLevelState.state = value
          })
      })
  }
}

export default SensorMultiLevelSupport
