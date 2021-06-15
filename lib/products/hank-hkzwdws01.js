'use strict'

import UnknownProduct from './unknown'
import BatteryLevelSupport from './mixin-battery-level'
import AlarmSupport from './mixin-alarm'

// Doc found:
// https://products.z-wavealliance.org/products/2844

/* Frames for retro-engineering
  Réveil :
  node #12: {"class_id":128,"instance":1,"index":0,"label":"Battery Level","value":100}.

  node #12: {"class_id":112,"instance":1,"index":14,"label":"BASIC SET command","value":"Disabled"}.
   => Commande de modules associés au groupe 2
  node #12: {"class_id":112,"instance":1,"index":15,"label":"Value of the BASIC SET","value":"255"}.
   => type d'ordre envoyé aux modules associés au groupe 2. 0(default) = normally closed ; 1 = normally opened
  node #12: {"class_id":112,"instance":1,"index":32,"label":"Level of low battery","value":10}.
   => niveau de pile déclenchant une alerte "pile faible" (20% default ?)
  node #12: {"class_id":48,"instance":1,"index":0,"label":"Sensor","value":false}.
  node #12: {"class_id":132,"instance":1,"index":1,"label":"Minimum Wake-up Interval","value":0}.
  node #12: {"class_id":132,"instance":1,"index":2,"label":"Maximum Wake-up Interval","value":0}.
  node #12: {"class_id":132,"instance":1,"index":3,"label":"Default Wake-up Interval","value":0}.
  node #12: {"class_id":132,"instance":1,"index":4,"label":"Wake-up Interval Step","value":0}.
  node #12: {"class_id":132,"instance":1,"index":0,"label":"Wake-up Interval","value":0}.

  opening door:
  node #12: {"class_id":113,"instance":1,"index":6,"label":"Access Control","value":"Door/Window Open"}.
  closing door:
  node #12: {"class_id":113,"instance":1,"index":6,"label":"Access Control","value":"Door/Window Closed"}.
  burglar:
  node #12: {"class_id":113,"instance":1,"index":7,"label":"Home Security","value":"Tampering -  Cover Removed"}.
  un-burglar:
  node #12: {"class_id":113,"instance":1,"index":256,"label":"Previous Event Cleared","value":3}.
  node #12: {"class_id":113,"instance":1,"index":7,"label":"Home Security","value":"Clear"}.
 */

const _alarmMapper = {
  6: (value) => {
    switch (value) {
      case 'Door/Window Open':
        return [true, 'Access Control']
      case 'Door/Window Closed':
      case 'Clear':
        return [false, 'Access Control']
    }
  },
  7: (value) => ([value !== 'Clear', 'Burglar']),
  8: (value) => ([value !== 'Clear', 'Power Management'])
}

_alarmMapper[6].description = {
  label: 'Access control alarm (sensor opened/closed)',
  shortLabel: 'Access control',
  cases: {
    0: 'Clear',
    22: 'Door/Window Open',
    23: 'Door/Window Closed',
    defaults: [22]
  }
}

_alarmMapper[7].description = {
  label: 'Burglar alarm (sensor tampered, cover removed)',
  shortLabel: 'Burglar',
  cases: {
    0: 'Clear',
    3: 'Tampering -  Cover Removed',
    defaults: [3]
  }
}

_alarmMapper[8].description = {
  label: 'Power Management (power level critical)',
  shortLabel: 'Power',
  cases: {
    0: 'Clear',
    11: 'Replace Battery Now',
    defaults: [11]
  }
}

class HankHkzwdws01 extends UnknownProduct.with(
  BatteryLevelSupport(0, { minLevel: 0, maxLevel: 100 }, { lowBatteryAlarmIndex: 11, alarmCondition: (v) => v > 0 && v < 254 }), // Adds battery level support with low Batt alarm support
  AlarmSupport(_alarmMapper)) { // Opened/Closed sensor as alarm events

  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.dataHandler = context.dataHandler
    this.privateSocketIo = context.privateSocketIo
    this.scenariiService = context.scenariiService

    const c = HankHkzwdws01.meta.configurations
    this.requestConfigurations(
      c.NORMAL_STATE
    )
  }

  // Overrides AlarmSupport _alarmStatesInitialized()
  _alarmStatesInitialized () {
    super._alarmStatesInitialized()
    const alarm = (this.alarmGetLastLabel(6) || [false])[0]
    this.updateToBitmaskState(alarm)
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || HankHkzwdws01.meta.name(this.node.nodeid)
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

  isAccessControlAlarmOn () {
    const lastLabel = this.alarmGetLastLabel(6)
    return (lastLabel && lastLabel.length > 0 && lastLabel[1] === 'Access Control') ? lastLabel[0] : undefined
  }

  isBurglarAlarmOn () {
    const lastLabel = this.alarmGetLastLabel(7)
    return (lastLabel && lastLabel.length > 0 && lastLabel[1] === 'Burglar') ? lastLabel[0] : undefined
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
    let normallyClosed = this.getConfiguration(HankHkzwdws01.meta.configurations.NORMAL_STATE)
    normallyClosed = (normallyClosed === 0) || (normallyClosed === 'Closed') || (normallyClosed === 'Door/Window Closed')
    const opened = (normallyClosed && alarm) || (!normallyClosed && !alarm)

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
                        const newState = (opened ^ !way) ? (bitmaskState.state | shift) : (bitmaskState.state & ~shift)

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

HankHkzwdws01.meta = {
  name: (nodeid) => `Door/Window sensor #${nodeid} (Hank)`,
  manufacturer: 'Hank',
  manufacturerid: '0x0208',
  product: 'HKZW-DWS01',
  producttype: '0x0200',
  productid: '0x0008',
  type: 'Sensor',
  passive: true,
  battery: true,
  icon: 'HankHkzwdws01',
  settingPanel: 'hank-hkzwdws01',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation', 'batteryLevelGetPercent', 'batteryLevelGetIcon',
    'alarmGetLastLabel', 'alarmGetLabelHistory',
    'getConfiguration', 'setConfiguration', 'isAccessControlAlarmOn', 'isBurglarAlarmOn', 'alarmGetSupportedLabels',
    'getStateId', 'setStateId', 'getStateBehavior', 'setStateBehavior', 'getForceBitmaskStatePosition', 'setForceBitmaskStatePosition'],
  configurations: { NORMAL_STATE: 1 },
  alarmMapper: _alarmMapper,
  alarmSupportedLabels: {
    6: _alarmMapper[6].description,
    7: _alarmMapper[7].description,
    8: _alarmMapper[8].description,
    defaults: 6
  }
}

export default HankHkzwdws01
