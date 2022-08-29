'use strict'

import UnknownProduct from './unknown'
import NameLocationFromDataSupport from './mixin-name-location-from-data'
import BatteryLevelSupport from './mixin-battery-level'

import alarmMapper from './heiman-hs1saz-alarm-mapper'
import AlarmSupport from './mixin-alarm'

// Doc found:
// https://products.z-wavealliance.org/products/3006

/**
 * Retro engineering
 * Pressing test button :
 * {"class_id":113,"instance":1,"index":1,"label":"Smoke Alarm","value":"Smoke Detected at Unknown Location"}.
 * {"class_id":128,"instance":1,"index":0,"label":"Battery Level","value":100}.
 * {"class_id":113,"instance":1,"index":256,"label":"Previous Event Cleared","value":2}.
 * {"class_id":113,"instance":1,"index":1,"label":"Smoke Alarm","value":"Clear"}.
 */

class HeimanHs1saz extends UnknownProduct.with(
  NameLocationFromDataSupport(), // store name and location in DB (not supported by node itself)
  BatteryLevelSupport(0, { minLevel: 0, maxLevel: 100 }, { lowBatteryAlarmIndex: 11, alarmCondition: (v) => v > 0 && v < 254 }), // Adds battery level support with low Batt alarm support
  AlarmSupport(alarmMapper)) { // Opened/Closed sensor as alarm events

  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
  }

  // Overrides AlarmSupport _alarmStatesInitialized()
  _alarmStatesInitialized () {
    super._alarmStatesInitialized()
    const alarm = (this.alarmGetLastLabel(1) || [false])[0]
    this.updateToBitmaskState(alarm)
  }

  getName () {
    return super.getName() || HeimanHs1saz.meta.name(this.node.nodeid)
  }

  classValueChanged (comClass, value) {
    if (value.instance !== 1) {
      return // only 1 instance available on this product
    }

    if (comClass === 113 && value.index === 1) {
      this.updateToBitmaskState(value.value === 'Smoke Detected at Unknown Location')
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
  }

  setStateId (bitmaskStateId) {
    this.node.stateId = bitmaskStateId
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
      .then((item) => {
        if (!item) {
          item = {}
        }
        item.stateId = bitmaskStateId
        return item
      })
      .then((item) => this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item))
      .then(() => {
        const alarm = (this.alarmGetLastLabel(1) || [false])[0]
        this.updateToBitmaskState(alarm)
      })
      .catch(console.error)
  }

  getStateId () {
    if (this.node.stateId) {
      return Promise.resolve(this.node.stateId)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
      .then((item) => {
        if (item) {
          this.node.stateId = item.stateId
          return item.stateId
        }
        return null
      })
      .catch(console.error)
  }

  updateToBitmaskState (alarm) {
    this.getStateBehavior()
      .then((stateBehavior) => {
        return this.getStateId()
          .then((stateId) => {
            if (stateId) {
              this.scenariiService.getStateInstance(this.node.stateId)
                .then((bitmaskState) => {
                  if (bitmaskState) {
                    this.getForceBitmaskStatePosition()
                      .then((force) => {
                        const shift = Math.abs(stateBehavior)
                        const way = (shift == stateBehavior) // stateBehavior positive => true
                        const newState = (alarm ^ !way) ? (bitmaskState.state | shift) : (bitmaskState.state & ~shift)

                        if (force) {
                          if (this._forceBitmaskStateListenerId) {
                            bitmaskState.removeListener(this._forceBitmaskStateListenerId)
                          }
                          const listener = () => {}
                          listener.preValidate = (state, s, oldState) => {
                            return (state & shift) === (newState & shift)
                          }
                          this._forceBitmaskStateListenerId = bitmaskState.addListener(listener)
                        }

                        bitmaskState.state = newState
                      })
                  }
                })
                .catch(console.error)
            }
          })
      })
  }

  getStateBehavior () {
    if (this.node.stateBehavior) {
      return Promise.resolve(this.node.stateBehavior)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
      .then((item) => {
        if (item) {
          this.node.stateBehavior = item.stateBehavior || 1
          return item.stateBehavior || 1
        }
        return 1
      })
      .catch((error) => {
        console.log(error)
        return 1
      })
  }

  setStateBehavior (behavior) {
    this.node.stateBehavior = behavior
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
      .then((item) => {
        if (!item) {
          item = {}
        }
        item.stateBehavior = behavior
        return item
      })
      .then((item) => this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item))
      .then(() => {
        const alarm = (this.alarmGetLastLabel(1) || [false])[0]
        this.updateToBitmaskState(alarm)
      })
      .catch(console.error)
  }

  getForceBitmaskStatePosition () {
    if (this.node.forceBitmaskStatePosition) {
      return Promise.resolve(this.node.forceBitmaskStatePosition)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
      .then((item) => {
        if (item) {
          this.node.forceBitmaskStatePosition = item.forceBitmaskStatePosition
          return item.forceBitmaskStatePosition
        }
        return true
      })
      .catch((error) => {
        console.log(error)
        return true
      })
  }

  setForceBitmaskStatePosition (force) {
    this.node.forceBitmaskStatePosition = force
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
      .then((item) => {
        if (!item) {
          item = {}
        }
        item.forceBitmaskStatePosition = force
        return item
      })
      .then((item) => this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item))
      .then(() => {
        const alarm = (this.alarmGetLastLabel(1) || [false])[0]
        this.updateToBitmaskState(alarm)
      })
      .catch(console.error)
  }
}

HeimanHs1saz.meta = {
  name: (nodeid) => `Smoke sensor #${nodeid} (Heiman)`,
  manufacturer: 'Heiman',
  manufacturerid: '0x0260',
  product: 'HS1SA-Z',
  producttype: '0x8002',
  productid: '0x1000',
  type: 'Sensor',
  passive: true,
  battery: true,
  icon: 'HeimanHs1saz',
  settingPanel: 'heiman-hs1saz',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation', 'batteryLevelGetPercent', 'batteryLevelGetIcon',
    'alarmGetLastLabel', 'alarmGetLabelHistory', 'alarmIsOn', 'alarmGetSupportedLabels',
    'getStateId', 'setStateId', 'getStateBehavior', 'setStateBehavior', 'getForceBitmaskStatePosition', 'setForceBitmaskStatePosition'],
  alarmMapper: alarmMapper,
  alarmSupportedLabels: {
    1: alarmMapper[1].description,
    defaults: 1
  }
}

export default HeimanHs1saz
