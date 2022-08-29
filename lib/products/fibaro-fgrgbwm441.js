'use strict'

import debounce from 'debounce'

import UnknownProduct from './unknown'
import MultiLevelSwitchSupport from './mixin-multi-level-switch'
import SensorMultiLevelSupport from './mixin-sensor-multi-level'
import MeterSupport from './mixin-meter'
import EnergyConsumptionMeterSupport from './mixin-energy-consumption'

/*
  https://products.z-wavealliance.org/products/1054  --->  Command Class Multi-Channel V1 ???
  https://manuals.fibaro.com/rgbw/

  COMMAND_CLASS_SWITCH_MULTILEVEL / COMMAND_CLASS_SWITCH_MULTILEVEL_V2
    {"class_id":38,"instance":1,"index":0,"label":"Level","value":0}.
    {"class_id":38,"instance":1,"index":1,"label":"Bright"}.
    {"class_id":38,"instance":1,"index":2,"label":"Dim"}.
    {"class_id":38,"instance":1,"index":3,"label":"Ignore Start Level","value":true}.
    {"class_id":38,"instance":1,"index":4,"label":"Start Level","value":0}.

    {"class_id":38,"instance":2,"index":0,"label":"Instance 2: Level","value":0}.
    {"class_id":38,"instance":2,"index":1,"label":"Instance 2: Bright"}.
    {"class_id":38,"instance":2,"index":2,"label":"Instance 2: Dim"}.
    {"class_id":38,"instance":2,"index":3,"label":"Instance 2: Ignore Start Level","value":true}.
    {"class_id":38,"instance":2,"index":4,"label":"Instance 2: Start Level","value":0}.

    {"class_id":38,"instance":3,"index":0,"label":"Instance 3: Level","value":0}.
    {"class_id":38,"instance":3,"index":1,"label":"Instance 3: Bright"}.
    {"class_id":38,"instance":3,"index":2,"label":"Instance 3: Dim"}.
    {"class_id":38,"instance":3,"index":3,"label":"Instance 3: Ignore Start Level","value":true}.
    {"class_id":38,"instance":3,"index":4,"label":"Instance 3: Start Level","value":0}.

    {"class_id":38,"instance":4,"index":0,"label":"Instance 4: Level","value":0}.
    {"class_id":38,"instance":4,"index":1,"label":"Instance 4: Bright"}.
    {"class_id":38,"instance":4,"index":2,"label":"Instance 4: Dim"}.
    {"class_id":38,"instance":4,"index":3,"label":"Instance 4: Ignore Start Level","value":true}.
    {"class_id":38,"instance":4,"index":4,"label":"Instance 4: Start Level","value":0}.

    {"class_id":38,"instance":5,"index":0,"label":"Instance 5: Level","value":0}.
    {"class_id":38,"instance":5,"index":1,"label":"Instance 5: Bright"}.
    {"class_id":38,"instance":5,"index":2,"label":"Instance 5: Dim"}.
    {"class_id":38,"instance":5,"index":3,"label":"Instance 5: Ignore Start Level","value":true}.
    {"class_id":38,"instance":5,"index":4,"label":"Instance 5: Start Level","value":0}.

    {"class_id":38,"instance":6,"index":0,"label":"Instance 6: Level","value":0}.
    {"class_id":38,"instance":6,"index":1,"label":"Instance 6: Bright"}.
    {"class_id":38,"instance":6,"index":2,"label":"Instance 6: Dim"}.
    {"class_id":38,"instance":6,"index":3,"label":"Instance 6: Ignore Start Level","value":true}.
    {"class_id":38,"instance":6,"index":4,"label":"Instance 6: Start Level","value":0}.

    {"class_id":38,"instance":1,"index":0,"label":"Instance 1: Level","value":0}.
    {"class_id":38,"instance":2,"index":0,"label":"Instance 2: Level","value":0}.
    {"class_id":38,"instance":3,"index":0,"label":"Instance 3: Level","value":0}.
    {"class_id":38,"instance":4,"index":0,"label":"Instance 4: Level","value":0}.
    {"class_id":38,"instance":5,"index":0,"label":"Instance 5: Level","value":0}.
    {"class_id":38,"instance":6,"index":0,"label":"Instance 6: Level","value":0}.

  mixin SensorMultiLevelSupport(1, 4), // Adds instant energy (Watts) support
    {"class_id":49,"instance":1,"index":4,"label":"Power","value":"0.0"}.
  mixin MeterSupport(1, 0) // Adds power consumption (kWh) support
    {"class_id":50,"instance":1,"index":257,"label":"Reset"}.
    {"class_id":50,"instance":1,"index":0,"label":"Electric - kWh","value":"0.00"}.
    {"class_id":50,"instance":1,"index":2,"label":"Electric - W","value":"0.0"}.
  mixin EnergyConsumptionMeterSupport(0, 1, 1)) // Uses both previous to improove consumption feature with price

  Supported configurations:
      {"class_id":112,"instance":1,"index":1,"label":"Enable/Disable ALL ON/OFF","value":"ALL ON active / ALL OFF active"}.
                    <Item label="ALL ON disabled/ ALL OFF disabled" value="0" />
					<Item label="ALL ON disabled/ ALL OFF active" value="1" />
					<Item label="ALL ON active / ALL OFF disabled" value="2" />
					<Item label="ALL ON active / ALL OFF active" value="255" /> /!\ Ici openzwave semble fournir 255 en possibilités, mais il faut utiliser 3 !!!
                    {"class_id":39,"instance":1,"index":0,"label":"Switch All","value":"Disabled"}.
                    {"class_id":39,"instance":1,"index":0,"label":"Switch All","value":"On and Off Enabled"}.
      {"class_id":112,"instance":1,"index":8,"label":"Outputs state change mode","value":"MODE 1 - Constant Speed (speed is defined by parameters 9 and 10)"}.
                    <Item label="MODE 1 - Constant Speed (speed is defined by parameters 9 and 10)" value="0" />
					<Item label="MODE 2 - Constant Time (RGB/RBGW only. Time is defined by parameter 11)" value="1" />
      {"class_id":112,"instance":1,"index":9,"label":"Dimming step value (for MODE 1)","value":1}.
                    min="1" max="99" value="1"
      {"class_id":112,"instance":1,"index":10,"label":"Time between dimming steps (for MODE 1)","value":10}.
                    min="0" max="60000" value="10" (ms)
      {"class_id":112,"instance":1,"index":11,"label":"Time to complete the entire transition (for MODE 2)","value":67}.
                    min="0" max="255" value="67" (1-&gt;63: 20ms-&gt;126ms (value*20ms); 65-&gt;127: 1s-&gt;63s (value-64)*1s; 129-&gt;191: 10s-&gt;630s (value-128)*10s; 193-&gt;255: 1min-&gt;63min (value-192)*1min. Default setting: 67 (3s))
      {"class_id":112,"instance":1,"index":12,"label":"Maximum dimmer level","value":255}.
      {"class_id":112,"instance":1,"index":13,"label":"Minimum dimmer level","value":2}.

  XXX Config to support, one day..., or not:
    {"class_id":112,"instance":1,"index":14,"label":"Inputs / Outputs configuration","value":4369}.
                    See https://manuals.fibaro.com/rgbw/
    {"class_id":112,"instance":1,"index":15,"label":"Option double click","value":"Double click enabled"}.
    {"class_id":112,"instance":1,"index":16,"label":"Saving state before power failure","value":"State saved at power failure, all outputs are set to previous state upon power restore"}.
    {"class_id":112,"instance":1,"index":42,"label":"Command class reporting Outputs status change","value":"Reporting as a result of inputs and controllers actions (SWITCH MULTILEVEL)"}.
    {"class_id":112,"instance":1,"index":43,"label":"Reporting 0-10v analog inputs change threshold","value":5}.
    {"class_id":112,"instance":1,"index":44,"label":"Power load reporting frequency","value":30}.
    {"class_id":112,"instance":1,"index":45,"label":"Reporting changes in energy consumed by controlled devices","value":10}.
    {"class_id":112,"instance":1,"index":71,"label":"Response to BRIGHTNESS set to 0%","value":"Last set colour is memorized"}.
    {"class_id":112,"instance":1,"index":72,"label":"Starting predefined program","value":1}.
    {"class_id":112,"instance":1,"index":73,"label":"Triple Click Action","value":"NODE INFO control frame is sent"}.
 */

class FibaroFgrgbwm441 extends UnknownProduct.with(
  MultiLevelSwitchSupport(2, 0, { minLevel: 0, maxLevel: 99 }), // Main brightness
  MultiLevelSwitchSupport(3, 0, { minLevel: 0, maxLevel: 99 }), // R: Red
  MultiLevelSwitchSupport(4, 0, { minLevel: 0, maxLevel: 99 }), // G: Green
  MultiLevelSwitchSupport(5, 0, { minLevel: 0, maxLevel: 99 }), // B: Blue
  MultiLevelSwitchSupport(6, 0, { minLevel: 0, maxLevel: 99 }), // W: White
  SensorMultiLevelSupport(1, 4), // Adds instant energy (Watts) support
  MeterSupport(1, 0), // Adds power consumption (kWh) support
  EnergyConsumptionMeterSupport(0, 1, 1)) { // Uses both previous to improove consumption feature with price

  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.dataHandler = context.dataHandler
    this.privateSocketIo = context.privateSocketIo
    this.scenariiService = context.scenariiService

    const c = FibaroFgrgbwm441.meta.configurations
    this.requestConfigurations(
      c.ENABLE_ALL_ON_OFF,
      c.OUTPUTS_STATE_CHANGE_MODE,
      c.DIMMING_STEP_VALUE_MODE_1,
      c.TIME_BETWEEN_DIMMING_STEPS_MODE_1,
      c.TIME_TO_COMPLETE_TRANSITION_MODE_2,
      c.MAXIMUM_DIMMER_LEVEL,
      c.MINIMUM_DIMMER_LEVEL
    )

    this.levelStateListener = null
    this.debouncedSetColorFromStateLevel = debounce((colorRatios, fixedBrightness) => {
      const getBrightness = fixedBrightness < 0 ? this.multiLevelSwitchGetValue(2) : Promise.resolve(fixedBrightness)
      getBrightness.then(brightness => {
        this.multiLevelSwitchSetPercent(colorRatios[0] * brightness, 3)
        this.multiLevelSwitchSetPercent(colorRatios[1] * brightness, 4)
        this.multiLevelSwitchSetPercent(colorRatios[2] * brightness, 5)
        this.multiLevelSwitchSetPercent(colorRatios[3] * brightness, 6)
      })
    }, 500, false)
    this.updateColorFromLevelState()

    this.autoDimmerTimer = null
    this.updateAutoDimmer()
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || FibaroFgrgbwm441.meta.name(this.node.nodeid)
  }

  multiLevelSwitchSetPercent (percent, instance = 1, noAutoDimm = false) {
    super.multiLevelSwitchSetPercent(percent, instance)
    if (!noAutoDimm) {
      this.updateAutoDimmer()
    }
  }

  multiLevelSwitchSetValue (value, instance = 1, noAutoDimm = false) {
    super.multiLevelSwitchSetValue(value, instance)
    if (!noAutoDimm) {
      this.updateAutoDimmer()
    }
  }

  setRGBWColorsPercent (red, green, blue, white) {
    super.multiLevelSwitchSetPercent(red, 3)
    super.multiLevelSwitchSetPercent(green, 4)
    super.multiLevelSwitchSetPercent(blue, 5)
    super.multiLevelSwitchSetPercent(white, 6)
    this.updateAutoDimmer()
  }

  setRGBWBrightnessPercent (brightness) {
    super.multiLevelSwitchSetPercent(brightness, 2)
    this.updateAutoDimmer()
  }

  setColorLevelStateId (levelStateId) {
    this.node.colorLevelStateId = levelStateId
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (!item) {
        item = {}
      }
      item.colorLevelStateId = levelStateId
      return this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item)
      .then(() => {
        this.updateColorFromLevelState()
      })
    })
    .catch(console.error)
  }

  getColorLevelStateId () {
    if (this.node.colorLevelStateId) {
      return Promise.resolve(this.node.colorLevelStateId)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (item) {
        this.node.colorLevelStateId = item.colorLevelStateId
        return item.colorLevelStateId
      }
      return null
    })
    .catch(console.error)
  }

  setBrightnessLevelState (brightnessLevelState) {
    this.node.brightnessLevelState = brightnessLevelState
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (!item) {
        item = {}
      }
      item.brightnessLevelState = brightnessLevelState
      return this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item)
      .then(() => {
        this.updateColorFromLevelState()
      })
    })
    .catch(console.error)
  }

  getBrightnessLevelState () {
    if (this.node.brightnessLevelState) {
      return Promise.resolve(this.node.brightnessLevelState)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (item && Number.isInteger(item.brightnessLevelState)) {
        this.node.brightnessLevelState = item.brightnessLevelState
        return item.brightnessLevelState
      }
      this.node.brightnessLevelState = -1
      return -1
    })
    .catch(console.error)
  }

  updateColorFromLevelState () {
    if (this.levelStateListener) {
      const { listenerId, levelState } = this.levelStateListener
      levelState.removeListener(listenerId)
      this.levelStateListener = null
    }

    return this.getColorLevelStateId()
    .then((colorLevelStateId) => {
      if (colorLevelStateId) {
        this.scenariiService.getStateInstance(this.node.colorLevelStateId)
        .then((levelState) => {
          if (levelState) {
            const listener = this.generateColorFromStateListener(this.getBrightnessLevelState())
            const listenerId = levelState.addListener(listener)
            this.levelStateListener = { listenerId, levelState }
            listener(levelState.state, levelState)
          }
        })
        .catch(console.error)
      }
    })
  }

  generateColorFromStateListener (fixedBrightness = -1) {
    return ((state, levelState) => {
      const colorRatios = FibaroFgrgbwm441.meta.colorStateIndexes[levelState.color] || 0 // none if unsupported
      this.debouncedSetColorFromStateLevel(colorRatios, fixedBrightness)
    }).bind(this)
  }

  getAutoDimmAmount () {
    if (this.node.autoDimmAmount) {
      return Promise.resolve(this.node.autoDimmAmount)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (item) {
        this.node.autoDimmAmount = item.autoDimmAmount
        return item.autoDimmAmount
      }
      return -1
    })
    .catch(console.error)
  }

  setAutoDimmAmount (autoDimmAmount) {
    this.node.autoDimmAmount = autoDimmAmount
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (!item) {
        item = {}
      }
      item.autoDimmAmount = autoDimmAmount
      return this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item)
      .then(() => {
        this.updateAutoDimmer()
      })
    })
    .catch(console.error)
  }

  getAutoDimmTime () {
    if (this.node.autoDimmTime) {
      return Promise.resolve(this.node.autoDimmTime)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (item) {
        this.node.autoDimmTime = item.autoDimmTime
        return item.autoDimmTime
      }
      return 5 * 3600 * 1000
    })
    .catch(console.error)
  }

  setAutoDimmTime (autoDimmTime) {
    this.node.autoDimmTime = autoDimmTime
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (!item) {
        item = {}
      }
      item.autoDimmTime = autoDimmTime
      return this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item)
      .then(() => {
        this.updateAutoDimmer()
      })
    })
    .catch(console.error)
  }

  updateAutoDimmer () {
    if (this.autoDimmerTimer) {
      clearTimeout(this.autoDimmerTimer)
    }

    this.getAutoDimmAmount()
    .then(dimm => {
      if (dimm === -1) {
        return // no auto dimm
      }

      this.getAutoDimmTime()
      .then(time => {
        this.autoDimmerTimer = setTimeout(() => {
          if (this.multiLevelSwitchGetPercent(2) > dimm) { // do not increase brightness, only decrease.
            this.multiLevelSwitchSetPercent(dimm, 2, true) // noAutoDimm mode, to avoid loop
          }
        }, time)
      })
    })
  }
}

FibaroFgrgbwm441.meta = {
  name: (nodeid) => `RGBW controller #${nodeid} (FIBARO RGBW Controller)`,
  manufacturer: 'FIBARO System',
  manufacturerid: '0x010f',
  product: 'FGRGBWM-441',
  producttype: '0x0900',
  productid: '0x1000',
  type: 'RGBW controller',
  passive: false,
  battery: false,
  icon: 'FibaroFgrgbwm441',
  settingPanel: 'fibaro-fgrgbwm441',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation',
    'meterResetCounter', 'meterGetLastValue', 'meterGetAllValues', 'meterGetUnits', 'meterGetLabel', 'meterGetFormatted',
    'getConfiguration', 'setConfiguration', 'sensorMultiLevelGetUnits', 'setColorLevelStateId', 'getColorLevelStateId',
    'setBrightnessLevelState', 'getBrightnessLevelState', 'getAutoDimmAmount', 'getAutoDimmTime', 'setAutoDimmAmount', 'setAutoDimmTime',
    'energyConsumptionMeterGetLastCost', 'sensorMultiLevelGetLabel', 'sensorMultiLevelGetUnits',
    'sensorMultiLevelGetFormatted', 'sensorMultiLevelGetValue', 'sensorMultiLevelGetHistory',
    'multiLevelSwitchSetPercent', 'multiLevelSwitchSetValue', 'multiLevelSwitchGetPercent', 'multiLevelSwitchGetValue',
    'setRGBWColorsPercent', 'setRGBWBrightnessPercent'],
  configurations: {
    ENABLE_ALL_ON_OFF: 1,
    // 6 not implemented: ASSOCIATIONS_COMMAND_CLASS_CHOICE
    OUTPUTS_STATE_CHANGE_MODE: 8,
    DIMMING_STEP_VALUE_MODE_1: 9,
    TIME_BETWEEN_DIMMING_STEPS_MODE_1: 10,
    TIME_TO_COMPLETE_TRANSITION_MODE_2: 11,
    MAXIMUM_DIMMER_LEVEL: 12,
    MINIMUM_DIMMER_LEVEL: 13,
    INPUTS_OUTPUTS_CONFIGURATION: 14,
    OPTION_DOUBLE_CLICK: 15,
    SAVING_STATE_BEFORE_POWER_FAILURE: 16,
    // 30, 38, 39 not implemented: ALARM features
    COMMAND_CLASS_REPORTING_OUTPUTS_STATUS_CHANGE: 42,
    REPORTING_0_10v_ANALOG_INPUTS_CHANGE_THRESHOLD: 43,
    POWER_LOAD_REPORTING_FREQUENCY: 44,
    REPORTING_CHANGES_ENERGY_CONSUMED_CONTROLLED_DEVICE: 45,
    RESPONSE_TO_BRIGHTNESS_SET_TO_0: 71,
    STARTING_PREDEFINED_PROGRAM: 72,
    TRIPLE_CLICK_ACTION: 73
  },
  colorStateIndexes: { // R G B W
    none: [0, 0, 0, 0],
    white: [0.3, 0.3, 0.2, 0.7],
    red: [1, 0, 0, 0],
    green: [0.1, 1, 0, 0],
    blue: [0, 0, 1, 0],
    yellow: [1, 1, 0, 0],
    cyan: [0, 0.7, 1, 0.1],
    purple: [0.9, 0, 0.9, 0.1]
  }
}

export default FibaroFgrgbwm441
