'use strict'

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


  TODO !0: New mixin ! COMMAND_CLASS_SWITCH_ALL
    {"class_id":39,"instance":1,"index":0,"label":"Switch All","value":"Disabled"}.
    {"class_id":39,"instance":1,"index":0,"label":"Switch All","value":"On and Off Enabled"}.


  mixin SensorMultiLevelSupport(4), // Adds instant energy (Watts) support
    {"class_id":49,"instance":1,"index":4,"label":"Power","value":"0.0"}.
  mixin MeterSupport(0) // Adds power consumption (kWh) support
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

  TODO !1 Config to support, or not:
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
    /* MultiLevelSwitchSupport(1, 0, { minLevel: 0, maxLevel: 255 }), Main brightness: same as instance 2, so inactive it. */
    MultiLevelSwitchSupport(2, 0, { minLevel: 0, maxLevel: 99 }), // Main brightness
    MultiLevelSwitchSupport(3, 0, { minLevel: 0, maxLevel: 99 }), // R: Red
    MultiLevelSwitchSupport(4, 0, { minLevel: 0, maxLevel: 99 }), // G: Green
    MultiLevelSwitchSupport(5, 0, { minLevel: 0, maxLevel: 99 }), // B: Blue
    MultiLevelSwitchSupport(6, 0, { minLevel: 0, maxLevel: 99 }), // W: White
    SensorMultiLevelSupport(4), // Adds instant energy (Watts) support
    MeterSupport(0), // Adds power consumption (kWh) support
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
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || FibaroFgrgbwm441.meta.name(this.node.nodeid)
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
    'meterResetCounter', 'meterGetLastValue', 'meterGetAllValues', 'meterGetUnits',
    'getConfiguration', 'setConfiguration', 'sensorMultiLevelGetUnits',
    'energyConsumptionMeterGetLastCost', 'sensorMultiLevelGetLabel', 'sensorMultiLevelGetUnits',
    'sensorMultiLevelGetFormatted', 'sensorMultiLevelGetValue', 'sensorMultiLevelGetHistory',
    'multiLevelSwitchSetPercent', 'multiLevelSwitchSetValue', 'multiLevelSwitchGetPercent', 'multiLevelSwitchGetValue'],
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
  }
}

export default FibaroFgrgbwm441
