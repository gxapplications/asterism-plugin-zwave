'use strict'

import UnknownProduct from './unknown'
import BatteryLevelSupport from './mixin-battery-level'
import SensorMultiLevelSupport from './mixin-sensor-multi-level'
import AlarmSupport from './mixin-alarm'
import NameLocationFromDataSupport from './mixin-name-location-from-data'

import alarmMapper from './fibaro-fgdw002-alarm-mapper'

/*
  https://products.z-wavealliance.org/ProductManual/File?folder=&filename=Manuals/2181/FGDW-002-EN-T-v0.3.2.pdf

  Burglar switch closing:
    {"class_id":113,"instance":1,"index":7,"label":"Home Security","value":"Clear"}

  Burglar switch opening (case to warn):
    {"class_id":113,"instance":1,"index":7,"label":"Home Security","value":"Tampering -  Cover Removed"}

  When approaching parts:
    {"class_id":113,"instance":1,"index":6,"label":"Access Control","value":"Door/Window Closed"}

  When separing parts:
    {"class_id":113,"instance":1,"index":6,"label":"Access Control","value":"Door/Window Open"}

  When battery is low:
    {"class_id":113,"instance":1,"index":8,"label":"Power Management","value":"Replace Battery Now"}

  Temperature meter:
    {"class_id":49,"instance":1,"index":1,"label":"Temperature","value":"18.9"}.
    {"class_id":113,"instance":1,"index":4,"label":"Heat","value":"Clear"}.

  Overheat/Underheat:
    {"class_id":113,"instance":1,"index":4,"label":"Heat","value":"OverHeat at Unknown at Location"}
    {"class_id":113,"instance":1,"index":4,"label":"Heat","value":"UnderHeat at Unknown Location"}
    Then after alarm:
    {"class_id":113,"instance":1,"index":4,"label":"Heat","value":"Clear"}

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
    {"class_id":113,"instance":1,"index":256,"label":"Previous Event Cleared","value":0}.

 */

class FibaroFgdw002 extends UnknownProduct.with(
  NameLocationFromDataSupport(), // store name and location in DB (not supported by node itself)
  BatteryLevelSupport(0, { minLevel: 0, maxLevel: 100 }, { lowBatteryAlarmIndex: 11, alarmCondition: (v) => v > 0 && v < 254 }), // Adds battery level support with low Batt alarm support
  SensorMultiLevelSupport(1, 1, '°C'), // temperature sensor
  AlarmSupport(alarmMapper)) { // Opened/Closed sensor as alarm events

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
    const alarm = (this.alarmGetLastLabel(6) || [false])[0]
    this.updateToBitmaskState(alarm)
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || FibaroFgdw002.meta.name(this.node.nodeid)
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

  isHeatAlarmOn () {
    const lastLabel = this.alarmGetLastLabel(4)
    return (lastLabel && lastLabel.length > 0 && lastLabel[1] === 'Heat') ? lastLabel[0] : undefined
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
    let normallyClosed = this.getConfiguration(FibaroFgdw002.meta.configurations.NORMAL_STATE)
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
    'getConfiguration', 'setConfiguration', 'isHeatAlarmOn', 'isAccessControlAlarmOn', 'isBurglarAlarmOn',
    'alarmIsOn', 'alarmGetSupportedLabels', 'alarmSetMuteIndex', 'alarmGetMuteIndex',
    'getStateId', 'setStateId', 'getStateBehavior', 'setStateBehavior', 'getForceBitmaskStatePosition', 'setForceBitmaskStatePosition',
    'sensorMultiLevelGetStateId', 'sensorMultiLevelSetStateId'],
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
  alarmMapper,
  alarmSupportedLabels: {
    4: alarmMapper[4].description,
    6: alarmMapper[6].description,
    7: alarmMapper[7].description,
    8: alarmMapper[8].description,
    defaults: 6
  }
}

export default FibaroFgdw002
