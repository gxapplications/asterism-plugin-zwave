'use strict'

import UnknownProduct from './unknown'
import BatteryLevelSupport from './mixin-battery-level'
import AlarmSupport from './mixin-alarm'
import alarmMapper from './kaipule-im20-alarm-mapper'
import NameLocationFromDataSupport from './mixin-name-location-from-data'

// Doc found:
// https://products.z-wavealliance.org/products/2027/

/* Frames for retro-engineering
  #20: {"class_id":48,"instance":1,"index":0,"label":"Sensor","value":false}.
  #20: {"class_id":113,"instance":1,"index":7,"label":"Home Security","value":"Clear"}.
  #20: {"class_id":128,"instance":1,"index":0,"label":"Battery Level","value":100}.
  #20: {"class_id":48,"instance":1,"index":0,"label":"Sensor","value":false}.
  #20: {"class_id":113,"instance":1,"index":6,"label":"Access Control","value":"Door/Window Closed"}.
  #20: {"class_id":48,"instance":1,"index":0,"label":"Sensor","value":true}.
  #20: {"class_id":113,"instance":1,"index":6,"label":"Access Control","value":"Door/Window Open"}.
  #20: {"class_id":48,"instance":1,"index":0,"label":"Sensor","value":true}.
  #20: {"class_id":113,"instance":1,"index":7,"label":"Home Security","value":"Tampering -  Cover Removed"}.
  #20: {"class_id":128,"instance":1,"index":0,"label":"Battery Level","value":100}.
  #20: {"class_id":48,"instance":1,"index":0,"label":"Sensor","value":false}.
  #20: {"class_id":113,"instance":1,"index":7,"label":"Home Security","value":"Clear"}.
  #20: {"class_id":128,"instance":1,"index":0,"label":"Battery Level","value":100}.
  #20: {"class_id":48,"instance":1,"index":0,"label":"Sensor","value":false}.
  #20: {"class_id":113,"instance":1,"index":6,"label":"Access Control","value":"Door/Window Closed"}.
  #20: {"class_id":48,"instance":1,"index":0,"label":"Sensor","value":true}.
  #20: {"class_id":113,"instance":1,"index":6,"label":"Access Control","value":"Door/Window Open"}.
  #20: {"class_id":48,"instance":1,"index":0,"label":"Sensor","value":true}.
  #20: {"class_id":113,"instance":1,"index":7,"label":"Home Security","value":"Tampering -  Cover Removed"}.
  #20: {"class_id":128,"instance":1,"index":0,"label":"Battery Level","value":100}.
  #20: {"class_id":48,"instance":1,"index":0,"label":"Sensor","value":false}.
  #20: {"class_id":113,"instance":1,"index":7,"label":"Home Security","value":"Clear"}.
 */

class KaipuleIm20 extends UnknownProduct.with(
  NameLocationFromDataSupport(), // store name and location in DB (not supported by node itself)
  BatteryLevelSupport(0, { minLevel: 0, maxLevel: 100 }), // Adds battery level support
  AlarmSupport(alarmMapper)) { // Opened/Closed sensor as alarm events

  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.dataHandler = context.dataHandler
    this.privateSocketIo = context.privateSocketIo
    this.scenariiService = context.scenariiService

    this._forceBitmaskStateListenerId = null
  }

  // Overrides AlarmSupport _alarmStatesInitialized()
  _alarmStatesInitialized () {
    super._alarmStatesInitialized()
    const alarm = (this.alarmGetLastLabel(6) || [false])[0]
    this.updateToBitmaskState(alarm)
  }

  getName () {
    return super.getName() || KaipuleIm20.meta.name(this.node.nodeid)
  }

  classValueChanged (comClass, value) {
    if (value.instance !== 1) {
      return // only 1 instance available on this product
    }

    if (comClass === 113 && value.index === 6) {
      this.updateToBitmaskState(value.value === 'Door/Window Open')
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
        const alarm = (this.alarmGetLastLabel(6) || [false])[0]
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
        const alarm = (this.alarmGetLastLabel(6) || [false])[0]
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
        const alarm = (this.alarmGetLastLabel(6) || [false])[0]
        this.updateToBitmaskState(alarm)
      })
      .catch(console.error)
  }
}

KaipuleIm20.meta = {
  name: (nodeid) => `Door sensor #${nodeid} (Kaipule)`,
  manufacturer: 'Kaipule',
  manufacturerid: '0x0214',
  product: 'IM20-Z-WAVE',
  producttype: '0x0002',
  productid: '0x0001',
  type: 'Sensor',
  passive: true,
  battery: true,
  icon: 'KaipuleIm20',
  settingPanel: 'kaipule-im20',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation', 'batteryLevelGetPercent', 'batteryLevelGetIcon',
    'alarmGetLastLabel', 'alarmGetLabelHistory', 'alarmIsOn', 'alarmGetSupportedLabels', 'alarmSetMuteIndex', 'alarmGetMuteIndex',
    'getStateId', 'setStateId', 'getStateBehavior', 'setStateBehavior', 'getForceBitmaskStatePosition', 'setForceBitmaskStatePosition'],
  alarmMapper: alarmMapper,
  alarmSupportedLabels: {
    6: alarmMapper[6].description,
    7: alarmMapper[7].description,
    defaults: 6
  }
}

export default KaipuleIm20
