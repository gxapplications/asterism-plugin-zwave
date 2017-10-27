'use strict'

import UnknownProduct from './unknown'
import BinarySwitchSupport from './mixin-binary-switch'
import SensorMultiLevelSupport from './mixin-sensor-multi-level'
import MeterSupport from './mixin-meter'

// docs found:
// https://github.com/jperkin/node-openzwave/blob/master/deps/open-zwave/config/fibaro/fgwpe.xml
// https://products.z-wavealliance.org/products/1653/embedpics
// https://products.z-wavealliance.org/products/1653/configs
// https://products.z-wavealliance.org/products/1653/classes

/* Frames for retro-engineering
 INIT SEQUENCE:
 'value added/changed events' : class 37,  {"type":"bool",    "genre":"user",   "instance":1, "index":0,  "label":"Switch","units":"","help":"","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"value":false}.
 'value added/changed events' : class 39,  {"type":"list",    "genre":"system", "instance":1, "index":0,  "label":"Switch All","units":"","help":"","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"values":["Disabled","Off Enabled","On Enabled","On and Off Enabled"],"value":"Disabled"}.
 'value added/changed events' : class 94,  {"type":"byte",    "genre":"system", "instance":1, "index":0,  "label":"ZWave+ Version","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":1}.
 'value added/changed events' : class 94,  {"type":"short",   "genre":"system", "instance":1, "index":1,  "label":"InstallerIcon","units":"","help":"","read_only":true,"write_only":false,"min":-32768,"max":32767,"is_polled":false,"value":1792}.
 'value added/changed events' : class 94,  {"type":"short",   "genre":"system", "instance":1, "index":2,  "label":"UserIcon","units":"","help":"","read_only":true,"write_only":false,"min":-32768,"max":32767,"is_polled":false,"value":1792}.
 'value added/changed events' : class 50,  {"type":"decimal", "genre":"user",   "instance":1, "index":0,  "label":"Unknown","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"0.0"}.
 'value added/changed events' : class 113, {"type":"byte",    "genre":"user",   "instance":1, "index":0,  "label":"Alarm Type","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":0}.
 'value added/changed events' : class 113, {"type":"byte",    "genre":"user",   "instance":1, "index":1,  "label":"Alarm Level","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":0}.
 'value added/changed events' : class 115, {"type":"list",    "genre":"system", "instance":1, "index":0,  "label":"Powerlevel","units":"dB","help":"","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"values":["Normal","-1dB","-2dB","-3dB","-4dB","-5dB","-6dB","-7dB","-8dB","-9dB"],"value":"Normal"}.
 'value added/changed events' : class 115, {"type":"byte",    "genre":"system", "instance":1, "index":1,  "label":"Timeout","units":"seconds","help":"","read_only":false,"write_only":false,"min":0,"max":255,"is_polled":false,"value":0}.
 'value added/changed events' : class 115, {"type":"button",  "genre":"system", "instance":1, "index":2,  "label":"Set Powerlevel","units":"","help":"","read_only":false,"write_only":true,"min":0,"max":0,"is_polled":false}.
 'value added/changed events' : class 115, {"type":"byte",    "genre":"system", "instance":1, "index":3,  "label":"Test Node","units":"","help":"","read_only":false,"write_only":false,"min":0,"max":255,"is_polled":false,"value":0}.
 'value added/changed events' : class 115, {"type":"list",    "genre":"system", "instance":1, "index":4,  "label":"Test Powerlevel","units":"dB","help":"","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"values":["Normal","-1dB","-2dB","-3dB","-4dB","-5dB","-6dB","-7dB","-8dB","-9dB"],"value":"Normal"}.
 'value added/changed events' : class 115, {"type":"short",   "genre":"system", "instance":1, "index":5,  "label":"Frame Count","units":"","help":"","read_only":false,"write_only":false,"min":-32768,"max":32767,"is_polled":false,"value":0}.
 'value added/changed events' : class 115, {"type":"button",  "genre":"system", "instance":1, "index":6,  "label":"Test","units":"","help":"","read_only":false,"write_only":true,"min":0,"max":0,"is_polled":false}.
 'value added/changed events' : class 115, {"type":"button",  "genre":"system", "instance":1, "index":7,  "label":"Report","units":"","help":"","read_only":false,"write_only":true,"min":0,"max":0,"is_polled":false}.
 'value added/changed events' : class 115, {"type":"list",    "genre":"system", "instance":1, "index":8,  "label":"Test Status","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"values":["Failed","Success","In Progress"],"value":"Failed"}.
 'value added/changed events' : class 115, {"type":"short",   "genre":"system", "instance":1, "index":9,  "label":"Acked Frames","units":"","help":"","read_only":true,"write_only":false,"min":-32768,"max":32767,"is_polled":false,"value":0}.
 'value added/changed events' : class 152, {"type":"bool",    "genre":"system", "instance":1, "index":0,  "label":"Secured","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":false}.
 'value added/changed events' : class 134, {"type":"string",  "genre":"system", "instance":1, "index":0,  "label":"Library Version","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"Unknown"}.
 'value added/changed events' : class 134, {"type":"string",  "genre":"system", "instance":1, "index":1,  "label":"Protocol Version","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"Unknown"}.
 'value added/changed events' : class 134, {"type":"string",  "genre":"system", "instance":1, "index":2,  "label":"Application Version","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"Unknown"}.
 'value added/changed events' : class 94,  {"type":"byte",    "genre":"system", "instance":1, "index":0,  "label":"ZWave+ Version","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":1}.
 'value added/changed events' : class 94,  {"type":"short",   "genre":"system", "instance":1, "index":1,  "label":"InstallerIcon","units":"","help":"","read_only":true,"write_only":false,"min":-32768,"max":32767,"is_polled":false,"value":1792}.
 'value added/changed events' : class 94,  {"type":"short",   "genre":"system", "instance":1, "index":2,  "label":"UserIcon","units":"","help":"","read_only":true,"write_only":false,"min":-32768,"max":32767,"is_polled":false,"value":1792}.
 'value added/changed events' : class 49,  {"type":"decimal", "genre":"user",   "instance":1, "index":4,  "label":"Power","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"0.0"}.
 'value added/changed events' : class 50,  {"type":"decimal", "genre":"user",   "instance":1, "index":8,  "label":"Power","units":"W","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"0.0"}.
 'value added/changed events' : class 50,  {"type":"bool",    "genre":"user",   "instance":1, "index":32, "label":"Exporting","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":false}.
 'value added/changed events' : class 50,  {"type":"button",  "genre":"system", "instance":1, "index":33, "label":"Reset","units":"","help":"","read_only":false,"write_only":true,"min":0,"max":0,"is_polled":false}.
 'value added/changed events' : class 113, {"type":"byte",    "genre":"user",   "instance":1, "index":2,  "label":"SourceNodeId","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":0}.
 'value added/changed events' : class 113, {"type":"byte",    "genre":"user",   "instance":1, "index":11, "label":"Power Management","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":0}.
 'value added/changed events' : class 134, {"type":"string",  "genre":"system", "instance":1, "index":0,  "label":"Library Version","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"3"}.
 'value added/changed events' : class 134, {"type":"string",  "genre":"system", "instance":1, "index":1,  "label":"Protocol Version","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"4.05"}.
 'value added/changed events' : class 134, {"type":"string",  "genre":"system", "instance":1, "index":2,  "label":"Application Version","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"3.02"}.
 'value added/changed events' : class 115, {"type":"list",    "genre":"system", "instance":1, "index":0,  "label":"Powerlevel","units":"dB","help":"","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"values":["Normal","-1dB","-2dB","-3dB","-4dB","-5dB","-6dB","-7dB","-8dB","-9dB"],"value":"Normal"}.
 'value added/changed events' : class 115, {"type":"byte",    "genre":"system", "instance":1, "index":1,  "label":"Timeout","units":"seconds","help":"","read_only":false,"write_only":false,"min":0,"max":255,"is_polled":false,"value":0}.
 'value added/changed events' : class 37,  {"type":"bool",    "genre":"user",   "instance":1, "index":0,  "label":"Switch","units":"","help":"","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"value":false}.
 'value added/changed events' : class 49,  {"type":"decimal", "genre":"user",   "instance":1, "index":4,  "label":"Power","units":"W","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"0.0"}.
 'value added/changed events' : class 50,  {"type":"bool",    "genre":"user",   "instance":1, "index":32, "label":"Exporting","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":false}.
 'value added/changed events' : class 50,  {"type":"decimal", "genre":"user",   "instance":1, "index":0,  "label":"Energy","units":"kWh","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"0.00"}.
 'value added/changed events' : class 50,  {"type":"bool",    "genre":"user",   "instance":1, "index":32, "label":"Exporting","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":false}.
 'value added/changed events' : class 50,  {"type":"decimal", "genre":"user",   "instance":1, "index":8,  "label":"Power","units":"W","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"0.0"}.
 'value added/changed events' : class 113, {"type":"byte",    "genre":"user",   "instance":1, "index":0,  "label":"Alarm Type","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":0}.
 'value added/changed events' : class 113, {"type":"byte",    "genre":"user",   "instance":1, "index":1,  "label":"Alarm Level","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":0}.
 'value added/changed events' : class 113, {"type":"byte",    "genre":"user",   "instance":1, "index":2,  "label":"SourceNodeId","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":0}.
 'value added/changed events' : class 113, {"type":"byte",    "genre":"user",   "instance":1, "index":11, "label":"Power Management","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":254}.
 'node ready event': node #2 ready to be used. {"nodeId":2,"nodeInfo":{"manufacturer":"FIBARO System","manufacturerid":"0x010f","product":"Unknown: type=0602, id=1001","producttype":"0x0602","productid":"0x1001","type":"On/Off Power Switch","name":"","loc":""}}

 MANUAL SWITCH - TURN OFF (plug button):
 'value added/changed events' : class 37, {"type":"bool",    "genre":"user", "instance":1, "index":0, "label":"Switch","units":"","help":"","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"value":false}.
 'value added/changed events' : class 49, {"type":"decimal", "genre":"user", "instance":1, "index":4, "label":"Power","units":"W","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"0.0"}.

 MANUAL SWITCH - TURN ON (plug button):
 'value added/changed events' : class 37, {"type":"bool",    "genre":"user", "instance":1, "index":0, "label":"Switch","units":"","help":"","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"value":true}.
 'value added/changed events' : class 49, {"type":"decimal", "genre":"user", "instance":1, "index":4, "label":"Power","units":"W","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"27.2"}.

 VARIATING USED POWER FROM LIGHT BULB (always on low power, color between white & blue):
 'value added/changed events' : class 49, {"type":"decimal", "genre":"user", "instance":1, "index":4, "label":"Power","units":"W","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"34.3"}.
 'value added/changed events' : class 49, {"type":"decimal", "genre":"user", "instance":1, "index":4, "label":"Power","units":"W","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"26.6"}.

 AFTER MINUTES, POWER IS STILL ON, ENERGY CONSUMED (every hour, one more sent, value is cumulated:
 1.
 'value added/changed events' : class 50, {"type":"bool",    "genre":"user", "instance":1, "index":32, "label":"Exporting","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":false}.
 'value added/changed events' : class 50, {"type":"decimal", "genre":"user", "instance":1, "index":0,  "label":"Energy","units":"kWh","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"0.02"}.
 2.
 'value added/changed events' : class 50, {"type":"bool",    "genre":"user", "instance":1, "index":32, "label":"Exporting","units":"","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":false}.
 'value added/changed events' : class 50, {"type":"decimal", "genre":"user", "instance":1, "index":0,  "label":"Energy","units":"kWh","help":"","read_only":true,"write_only":false,"min":0,"max":0,"is_polled":false,"value":"0.06"}.
*/

class FibaroFgwpe102zw5 extends UnknownProduct.with(BinarySwitchSupport, SensorMultiLevelSupport, MeterSupport) {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.dataHandler = context.dataHandler
    this.privateSocketIo = context.privateSocketIo

    const c = FibaroFgwpe102zw5.meta.configurations
    this.requestConfigurations(
      c.ALWAYS_ON_FUNCTION,
      c.POWER_AND_ENERGY_PERIODIC_REPORTS,
      c.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE,
      c.OVERLOAD_SAFETY_SWITCH,
      c.POWER_LOAD_FOR_VIOLET_COLOR,
      c.LED_RING_COLOR_WHEN_DEVICE_ON,
      c.LED_RING_COLOR_WHEN_DEVICE_OFF
    )
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || FibaroFgwpe102zw5.meta.name(this.node.nodeid)
  }

  setColorRingBehavior (behavior = 0) {
    const c = FibaroFgwpe102zw5.meta.configurations
    const behaviors = FibaroFgwpe102zw5.meta.colorBehaviors

    const defaultBehaviorLedOn = (this.node.defaultBehaviorLedOn !== undefined)
      ? this.node.defaultBehaviorLedOn
      : (this.getConfiguration(c.LED_RING_COLOR_WHEN_DEVICE_ON) || 1)

    switch (behavior) {
      case behaviors.DEVICE_DEFAULT: // color ring off when switch is off
        this.setConfiguration(c.LED_RING_COLOR_WHEN_DEVICE_ON, defaultBehaviorLedOn)
        this.setConfiguration(c.LED_RING_COLOR_WHEN_DEVICE_OFF, 0)
        break
      case behaviors.NIGHT_LIGHT: // when switch is on, default behavior. When switch is off, magenta colored
        this.setConfiguration(c.LED_RING_COLOR_WHEN_DEVICE_ON, defaultBehaviorLedOn)
        this.setConfiguration(c.LED_RING_COLOR_WHEN_DEVICE_OFF, 9) // magenta
        break
      case behaviors.STATUS_FROM_SCENARIO_ACTION:
        // TODO !3: many ways to do...
        break
      default:
        throw new Error('Unknown behavior for this product.')
    }
    this.node.colorRingBehavior = behavior
    this.privateSocketIo.emit('node-event-color-behavior-changed', this.node.nodeid, behavior)

    return this.dataHandler.getItem(`zwave-node-${this.node.nodeId}-data`)
    .then((item) => {
      item.colorRingBehavior = behavior
      return this.dataHandler.setItem(`zwave-node-${this.node.nodeId}-data`, item)
    })
  }

  getColorRingBehavior () {
    if (this.node.colorRingBehavior) {
        return Promise.resolve(this.node.colorRingBehavior)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeId}-data`)
    .then((item) => {
      if (item) {
        return item.colorRingBehavior
      }
      return FibaroFgwpe102zw5.meta.colorBehaviors.DEVICE_DEFAULT
    })
    .catch((error) => {
      console.log(error)
      return FibaroFgwpe102zw5.meta.colorBehaviors.DEVICE_DEFAULT
    })
  }

  classValueChanged (comClass, value) {
    if (value.instance !== 1) {
      return // only 1 instance available on this product
    }
    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
  }
}

FibaroFgwpe102zw5.meta = {
  name: (nodeid) => `Wall plug #${nodeid} (FIBARO On/Off switch)`,
  manufacturer: 'FIBARO System',
  manufacturerid: '0x010f',
  product: 'FGWPE-102 ZW5',
  producttype: '0x0602',
  productid: '0x1001',
  type: 'On/Off Power Switch',
  icon: 'FibaroFgwpe102zw5',
  settingPanel: 'fibaro-fgwpe102zw5',
  settingPanelProvidedFunctions: ['setColorRingBehavior', 'getColorRingBehavior', 'binarySwitchTurnOn',
    'binarySwitchTurnOff', 'binarySwitchTurnOnOff', 'binarySwitchInvert', 'binarySwitchGetState',
    'mixinMeterResetCounter', 'mixinMeterGetLastValue', 'getConfiguration', 'setConfiguration'],
  configurations: {
    ALWAYS_ON_FUNCTION: 1,
    HIGH_PRIORITY_POWER_REPORT: 10,
    STANDARD_POWER_REPORT: 11,
    POWER_REPORTING_INTERVAL: 12,
    POWER_REPORTING_THRESHOLD: 13,
    POWER_AND_ENERGY_PERIODIC_REPORTS: 14,
    MEASURING_ENERGY_CONSUMED_BY_THE_WALL_PLUG_ITSELF: 15,
    REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE: 2,
    CONTROL_OF_ON_OFF_BTN_ASSOCIATION_GROUP_2_DEVICES: 20,
    DOWN_VALUE_ON_OFF_ASSOCIATION_GROUP_3: 21,
    UP_VALUE_ON_OFF_ASSOCIATION_GROUP_3: 22,
    RESPONSE_AFTER_EXCEEDING_DEFINED_POWER_VALUES: 23,
    SWITCH_ON_VALUE_ON_OFF_ASSOCIATION_GROUPS: 24,
    OVERLOAD_SAFETY_SWITCH: 3,
    ACTIVE_ALARMS: 30,
    RESPONSE_TO_ALARM_FRAMES: 31,
    ALARM_STATE_DURATION: 32,
    POWER_LOAD_FOR_VIOLET_COLOR: 40,
    LED_RING_COLOR_WHEN_DEVICE_ON: 41,
    LED_RING_COLOR_WHEN_DEVICE_OFF: 42,
    LED_RING_COLOR_WHEN_ALARM_DETECTION: 43,
    ASSOCIATIONS_NETWORK_SECURITY_MODE: 50
  },
  colorBehaviors: {
    DEVICE_DEFAULT: 0,
    NIGHT_LIGHT: 1,
    STATUS_FROM_SCENARIO_ACTION: 2
  }
}

export default FibaroFgwpe102zw5
