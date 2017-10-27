'use strict'

import UnknownProduct from './unknown'
import BatteryLevelSupport from './mixin-battery-level'
import SensorMultiLevelSupport from './mixin-sensor-multi-level'
import AlarmSupport from './mixin-alarm'

/*
  https://products.z-wavealliance.org/ProductManual/File?folder=&filename=Manuals/2181/FGDW-002-EN-T-v0.3.2.pdf

  Burglar switch closing:
    {"class_id":113,"instance":1,"index":0,"label":"Alarm Type","value":0}.
    {"class_id":113,"instance":1,"index":1,"label":"Alarm Level","value":0}.
    {"class_id":113,"instance":1,"index":2,"label":"SourceNodeId","value":0}.
    {"class_id":113,"instance":1,"index":10,"label":"Burglar","value":0}.

  Burglar switch opening (case to warn):
    {"class_id":113,"instance":1,"index":0,"label":"Alarm Type","value":0}.
    {"class_id":113,"instance":1,"index":1,"label":"Alarm Level","value":0}.
    {"class_id":113,"instance":1,"index":2,"label":"SourceNodeId","value":0}.
    {"class_id":113,"instance":1,"index":10,"label":"Burglar","value":3}.

  When approaching parts:
    {"class_id":113,"instance":1,"index":0,"label":"Alarm Type","value":0}.
    {"class_id":113,"instance":1,"index":1,"label":"Alarm Level","value":0}.
    {"class_id":113,"instance":1,"index":2,"label":"SourceNodeId","value":0}.
    {"class_id":113,"instance":1,"index":9,"label":"Access Control","value":23}.

  When separing parts:
    {"class_id":113,"instance":1,"index":0,"label":"Alarm Type","value":0}.
    {"class_id":113,"instance":1,"index":1,"label":"Alarm Level","value":0}.
    {"class_id":113,"instance":1,"index":2,"label":"SourceNodeId","value":0}.
    {"class_id":113,"instance":1,"index":9,"label":"Access Control","value":22}.

  Temperature meter:
    {"class_id":49,"instance":1,"index":1,"label":"Temperature","value":"18.9"}.

  Managed configurations:
    {"class_id":112,"instance":1,"index":1,"label":"Door/window state","value":"Closed"}.
    {"class_id":112,"instance":1,"index":2,"label":"Visual LED indications","value":6}.
    {"class_id":112,"instance":1,"index":50,"label":"Interval of temperature measurements","value":300}. -> [0 or 5-32400] in seconds
    {"class_id":112,"instance":1,"index":51,"label":"Temperature reports threshold","value":10}. -> [0 or 1-300] in1/10 °C        => SHOULD BE IMPORTANT TO CONFIGURE THAT !
    {"class_id":112,"instance":1,"index":52,"label":"Interval of temperature reports","value":0}. -> [0 or 300-32400] in seconds  => SHOULD BE IMPORTANT TO CONFIGURE THAT !
    {"class_id":112,"instance":1,"index":53,"label":"Temperature offset","value":0}. -> [-1000–1000] in1/10 °C
    {"class_id":112,"instance":1,"index":54,"label":"Temperature alarm reports","value":"Disabled"}. -> mask (0 - nothing; 1 - high temperature alarm; 2 - low temperature alarm; 3 - high and low temperature alarms enabled)
    {"class_id":112,"instance":1,"index":55,"label":"High temperature alarm threshold","value":350}. -> [1-600] in 1/10 °C
    {"class_id":112,"instance":1,"index":56,"label":"Low temperature alarm threshold","value":100}. -> [0-599] in 1/10 °C

  Sometimes we can have these values : MUST FIND MEANING !
    {"class_id":113,"instance":1,"index":7,"label":"Heat","value":0}.
    {"class_id":113,"instance":1,"index":9,"label":"Access Control","value":0}.
    {"class_id":113,"instance":1,"index":10,"label":"Burglar","value":0}.
    {"class_id":113,"instance":1,"index":7,"label":"Heat","value":254}.
    {"class_id":113,"instance":1,"index":9,"label":"Access Control","value":254}.
    {"class_id":113,"instance":1,"index":10,"label":"Burglar","value":254}.
 */

const _alarmMapper = {
  7: (value) => ([value > 0 && value < 254, 'Heat']),
  9: (value) => (value === 22 ? [true, 'Access Control'] : (value === 23 ? [false, 'Access Control'] : null)),
  10: (value) => ([value > 0 && value < 254, 'Burglar']) // value 3 (or other than 0, not found during retro-engineering): means true.
}

_alarmMapper[7].description = {
  label: 'Heat alarm (temperature out of bounds)',
  shortLabel: 'Heat',
  cases: {
    0: 'No alarm',
    254: 'No alarm, rearming',
    others: 'Alarm',
    defaults: ['others']
  }
}

_alarmMapper[9].description = {
  label: 'Access control alarm (sensor opened/closed)',
  shortLabel: 'Access control',
  cases: {
    22: 'Alarm',
    23: 'No alarm',
    254: 'No alarm, rearming',
    defaults: [22]
  }
}

_alarmMapper[10].description = {
  label: 'Burglar alarm (sensor tampered, cover removed)',
  shortLabel: 'Burglar',
  cases: {
    0: 'No alarm',
    3: 'Alarm',
    254: 'No alarm, rearming',
    defaults: [3]
  }
}

class FibaroFgdw002 extends UnknownProduct.with(
    BatteryLevelSupport(0, { minLevel: 0, maxLevel: 100 }, { lowBatteryAlarmIndex: 11, alarmCondition: (v) => v > 0 && v < 254 }), // Adds battery level support with low Batt alarm support
    SensorMultiLevelSupport(1, '°C'), // temperature sensor
    AlarmSupport(_alarmMapper)) { // Opened/Closed sensor as alarm events

  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.dataHandler = context.dataHandler
    this.privateSocketIo = context.privateSocketIo
    this.scenariiService = context.scenariiService

    const c = FibaroFgdw002.meta.configurations
    this.requestConfigurations(
        c.NORMAL_STATE,
        c.LED_BEHAVIOR,
        c.TEMPERATURE_MEASURE_INTERVAL,
        c.TEMPERATURE_REPORTS_THRESHOLD,
        c.TEMPERATURE_FORCED_REPORTS_INTERVAL,
        c.TEMPERATURE_OFFSET,
        c.TEMPERATURE_ALARM_REPORTS,
        c.TEMPERATURE_ALARM_THRESHOLD_HIGH,
        c.TEMPERATURE_ALARM_THRESHOLD_LOW
    )

    this._forceBitmaskStateListenerId = null
  }

  // Overrides AlarmSupport _alarmStatesInitialized()
  _alarmStatesInitialized () {
    super._alarmStatesInitialized()
    const alarm = (this.alarmGetLastLabel(9) || [false])[0]
    this.updateToBitmaskState(alarm)
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || FibaroFgdw002.meta.name(this.node.nodeid)
  }

  classValueChanged (comClass, value) {
    if (value.instance !== 1) {
      return // only 1 instance available on this product
    }

    if (comClass === 113 && value.index === 9) {
      this.updateToBitmaskState(value.value === 22)
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
  }

  isHeatAlarmOn () {
    const lastLabel = this.alarmGetLastLabel(7)
    return (lastLabel && lastLabel.length > 0 && lastLabel[1] === 'Heat') ? lastLabel[0] : undefined
  }

  isAccessControlAlarmOn () {
    const lastLabel = this.alarmGetLastLabel(9)
    return (lastLabel && lastLabel.length > 0 && lastLabel[1] === 'Access Control') ? lastLabel[0] : undefined
  }

  isBurglarAlarmOn () {
    const lastLabel = this.alarmGetLastLabel(10)
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
      const alarm = (this.alarmGetLastLabel(9) || [false])[0]
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
    let normallyClosed = this.getConfiguration(FibaroFgdw002.meta.configurations.NORMAL_STATE)
    normallyClosed = (normallyClosed === 0) || (normallyClosed === 'Closed')
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
        return item.stateBehavior || 1
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
      const alarm = (this.alarmGetLastLabel(9) || [false])[0]
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
      const alarm = (this.alarmGetLastLabel(9) || [false])[0]
      this.updateToBitmaskState(alarm)
    })
    .catch(console.error)
  }
}

FibaroFgdw002.meta = {
  name: (nodeid) => `Door sensor #${nodeid} (FIBARO Door Opening Sensor 2)`,
  manufacturer: 'FIBARO System',
  manufacturerid: '0x010f',
  product: 'FGDW-002',
  producttype: '0x0702',
  productid: '0x1000',
  type: 'Door Opening Sensor 2',
  passive: true,
  battery: true,
  icon: 'FibaroFgdw002',
  settingPanel: 'fibaro-fgdw002',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation', 'batteryLevelGetPercent', 'batteryLevelGetIcon',
    'sensorMultiLevelGetValue', 'sensorMultiLevelGetHistory', 'sensorMultiLevelGetUnits', 'sensorMultiLevelGetLabel',
    'sensorMultiLevelGetFormatted', 'alarmGetLastLabel', 'alarmGetLabelHistory',
    'getConfiguration', 'setConfiguration', 'isHeatAlarmOn', 'isAccessControlAlarmOn', 'isBurglarAlarmOn', 'alarmGetSupportedLabels',
    'getStateId', 'setStateId', 'getStateBehavior', 'setStateBehavior', 'getForceBitmaskStatePosition', 'setForceBitmaskStatePosition'],
  configurations: {
    NORMAL_STATE: 1,
    LED_BEHAVIOR: 2,
    TEMPERATURE_MEASURE_INTERVAL: 50,
    TEMPERATURE_REPORTS_THRESHOLD: 51,
    TEMPERATURE_FORCED_REPORTS_INTERVAL: 52,
    TEMPERATURE_OFFSET: 53,
    TEMPERATURE_ALARM_REPORTS: 54,
    TEMPERATURE_ALARM_THRESHOLD_HIGH: 55,
    TEMPERATURE_ALARM_THRESHOLD_LOW: 56
  },
  alarmMapper: _alarmMapper,
  alarmSupportedLabels: {
    7: _alarmMapper[7].description,
    9: _alarmMapper[9].description,
    10: _alarmMapper[10].description,
    defaults: 9
  }
}

export default FibaroFgdw002
