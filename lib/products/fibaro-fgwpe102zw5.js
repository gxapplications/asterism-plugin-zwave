'use strict'

import UnknownProduct from './unknown'
import BinarySwitchSupport from './mixin-binary-switch'
import SensorMultiLevelSupport from './mixin-sensor-multi-level'
import MeterSupport from './mixin-meter'
import EnergyConsumptionMeterSupport from './mixin-energy-consumption'

// docs found:
// https://github.com/jperkin/node-openzwave/blob/master/deps/open-zwave/config/fibaro/fgwpe.xml
// https://products.z-wavealliance.org/products/1653/embedpics
// https://products.z-wavealliance.org/products/1653/configs
// https://products.z-wavealliance.org/products/1653/classes
// https://products.z-wavealliance.org/products/2818 (another version)

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

class FibaroFgwpe102zw5 extends UnknownProduct.with(
    BinarySwitchSupport(1, 0), // Adds On/Off switch features
    SensorMultiLevelSupport(4), // Adds instant energy (Watts) support
    MeterSupport(0), // Adds power consumption (kWh) support
    EnergyConsumptionMeterSupport(0, 1, 1)) { // Uses both previous to improove consumption feature with price
// TODO !1: is there any alarms that this product can trigger ? (power overheat, other native?)

  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.dataHandler = context.dataHandler
    this.privateSocketIo = context.privateSocketIo
    this.scenariiService = context.scenariiService

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

    this.levelStateListener = null
    this.updateColorRingFromLevelState()
    this.updateToBitmaskState()
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || FibaroFgwpe102zw5.meta.name(this.node.nodeid)
  }

  setColorRingBehavior (behavior = 0) {
    const c = FibaroFgwpe102zw5.meta.configurations
    const behaviors = FibaroFgwpe102zw5.meta.colorBehaviors

    switch (behavior) {
      case behaviors.DEVICE_DEFAULT: // color ring off when switch is off
        this.setConfiguration(c.LED_RING_COLOR_WHEN_DEVICE_ON, 1)
        this.setConfiguration(c.LED_RING_COLOR_WHEN_DEVICE_OFF, 0)
        break
      case behaviors.NIGHT_LIGHT: // when switch is on, default behavior. When switch is off, magenta colored
        this.setConfiguration(c.LED_RING_COLOR_WHEN_DEVICE_ON, 1)
        this.setConfiguration(c.LED_RING_COLOR_WHEN_DEVICE_OFF, 8) // magenta
        break
      case behaviors.STATUS_FROM_SCENARIO_STATE:
        // this.setConfiguration(c.LED_RING_COLOR_WHEN_DEVICE_ON, 0)
        // this.setConfiguration(c.LED_RING_COLOR_WHEN_DEVICE_OFF, 0)
        break
      default:
        throw new Error('Unknown behavior for this product.')
    }
    this.node.colorRingBehavior = behavior
    this.updateColorRingFromLevelState()
    this.privateSocketIo.emit('node-event-color-behavior-changed', this.node.nodeid, behavior)

    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (!item) {
        item = {}
      }
      item.colorRingBehavior = behavior
      return this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item)
    })
    .catch(console.error)
  }

  getColorRingBehavior () {
    if (this.node.colorRingBehavior) {
        return Promise.resolve(this.node.colorRingBehavior)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (item) {
        this.node.colorRingBehavior = item.colorRingBehavior
        return item.colorRingBehavior
      }
      return FibaroFgwpe102zw5.meta.colorBehaviors.DEVICE_DEFAULT
    })
    .catch((error) => {
      console.log(error)
      return FibaroFgwpe102zw5.meta.colorBehaviors.DEVICE_DEFAULT
    })
  }

  setColorRingLevelStateId (levelStateId) {
    this.node.colorRingLevelStateId = levelStateId
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (!item) {
        item = {}
      }
      item.colorRingLevelStateId = levelStateId
      return this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item)
      .then(() => {
        this.updateColorRingFromLevelState()
      })
    })
    .catch(console.error)
  }

  getColorRingLevelStateId () {
    if (this.node.colorRingLevelStateId) {
        return Promise.resolve(this.node.colorRingLevelStateId)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (item) {
        this.node.colorRingLevelStateId = item.colorRingLevelStateId
        return item.colorRingLevelStateId
      }
      return null
    })
    .catch(console.error)
  }

  classValueChanged (comClass, value) {
    if (value.instance !== 1) {
      return // only 1 instance available on this product
    }

    switch (comClass) {
      case 37: // 0x25
        if (value.index === 0) { // index is 0 for this product
          this.updateToBitmaskState(value.value)
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
  }

  updateColorRingFromLevelState () {
    if (this.levelStateListener) {
      const { listenerId, levelState } = this.levelStateListener
      levelState.removeListener(listenerId)
      this.levelStateListener = null
    }

    this.getColorRingBehavior()
    .then((colorRingBehavior) => {
      if (colorRingBehavior !== FibaroFgwpe102zw5.meta.colorBehaviors.STATUS_FROM_SCENARIO_STATE) {
        return
      }

      return this.getColorRingLevelStateId()
      .then((colorRingLevelStateId) => {
        if (colorRingLevelStateId) {
          this.scenariiService.getStateInstance(this.node.colorRingLevelStateId)
          .then((levelState) => {
            if (levelState) {
              const listenerId = levelState.addListener(this.coloRingFromLevelStateListener.bind(this))
              this.levelStateListener = { listenerId, levelState }
              this.coloRingFromLevelStateListener(levelState.state, levelState)
            }
          })
          .catch(console.error)
        } else {
          this.setConfiguration(FibaroFgwpe102zw5.meta.configurations.LED_RING_COLOR_WHEN_DEVICE_ON, 0)
          this.setConfiguration(FibaroFgwpe102zw5.meta.configurations.LED_RING_COLOR_WHEN_DEVICE_OFF, 0)
        }
      })
    })
  }

  coloRingFromLevelStateListener (state, levelState) {
    const deviceColor = FibaroFgwpe102zw5.meta.colorStateIndexes[levelState.color] || 0 // none if unsupported
    this.setConfiguration(FibaroFgwpe102zw5.meta.configurations.LED_RING_COLOR_WHEN_DEVICE_ON, deviceColor)
    this.setConfiguration(FibaroFgwpe102zw5.meta.configurations.LED_RING_COLOR_WHEN_DEVICE_OFF, deviceColor === 0 ? 0 : (deviceColor - 1))
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
      this.updateToBitmaskState()
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

  getStateBehavior () {
    if (this.node.stateBehavior) {
      return Promise.resolve(this.node.stateBehavior)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (item) {
        this.node.stateBehavior = item.stateBehavior || 1
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
      this.updateToBitmaskState()
    })
    .catch(console.error)
  }

  updateToBitmaskState (value) {
    return this.getStateId()
    .then((stateId) => {
      if (!stateId) {
        return
      }

      return this.scenariiService.getStateInstance(stateId)
      .then((bitmaskState) => {
        if (!bitmaskState) {
          return
        }

        if (value === undefined) {
          value = this.binarySwitchGetState()
        }

        this.getStateBehavior()
        .then((stateBehavior) => {
          this.getForceBitmaskStatePosition()
          .then((forcedMode) => {
            this.getControlledBitmaskStatePosition()
            .then((controlledMode) => {
              const shift = Math.abs(stateBehavior)
              const way = (shift == stateBehavior) // stateBehavior positive => true
              const newState = (value ^ !way) ? (bitmaskState.state | shift) : (bitmaskState.state & ~shift)

              if (this._forceBitmaskStateListenerId) {
                bitmaskState.removeListener(this._forceBitmaskStateListenerId)
              }
              if (forcedMode) {
                const listener = (state, s, oldState) => {}
                listener.preValidate = (state, s, oldState) => {
                  return (state & shift) === (newState & shift)
                }
                this._forceBitmaskStateListenerId = bitmaskState.addListener(listener)

              } else if (controlledMode) {
                // TODO !9: not reproduced yet, but this was not working with 2 plugs on the same bitmask state, at different positions, both controlled mode.

                const listener = (state, s, oldState) => {
                  // console.log('#1. nodeId=', this.node.nodeid, 'way=', way, ' shift=', shift, ' newState=', newState)
                  // console.log('#2. state=', state, ' oldState=', oldState)
                  // console.log('#3. (state & shift)=', (state & shift), ' (oldState & shift)=', (oldState & shift))
                  if ((state & shift) === (oldState & shift)) {
                    // console.log('#4. STOP')
                    return
                  }

                  // console.log('#4. CONTINUE')
                  const stateIsOn = (state & shift) === shift
                  const productIsOn = this.binarySwitchGetState()

                  if (way && (stateIsOn !== productIsOn)) {
                    this.binarySwitchTurnOnOff(stateIsOn)
                  } else if (!way && (stateIsOn === productIsOn)) {
                    this.binarySwitchTurnOnOff(!stateIsOn)
                  }

                }
                listener.preValidate = () => true
                this._forceBitmaskStateListenerId = bitmaskState.addListener(listener)
              }

              bitmaskState.state = newState
            })
          })
        })
      })
    })
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
      item.controlledBitmaskStatePosition = false
      return item
    })
    .then((item) => this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item))
    .then(() => {
      this.updateToBitmaskState()
    })
    .catch(console.error)
  }

  getControlledBitmaskStatePosition () {
    if (this.node.controlledBitmaskStatePosition) {
      return Promise.resolve(this.node.controlledBitmaskStatePosition)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (item) {
        this.node.controlledBitmaskStatePosition = item.controlledBitmaskStatePosition
        return item.controlledBitmaskStatePosition
      }
      return true
    })
    .catch((error) => {
      console.log(error)
      return false
    })
  }

  setControlledBitmaskStatePosition (controlled) {
    this.node.controlledBitmaskStatePosition = controlled
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (!item) {
        item = {}
      }
      item.controlledBitmaskStatePosition = controlled
      item.forceBitmaskStatePosition = false
      return item
    })
    .then((item) => this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item))
    .then(() => {
      this.updateToBitmaskState()
    })
    .catch(console.error)
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
  passive: false,
  battery: false,
  icon: 'FibaroFgwpe102zw5',
  settingPanel: 'fibaro-fgwpe102zw5',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation', 'setColorRingBehavior', 'getColorRingBehavior',
    'binarySwitchTurnOn', 'binarySwitchTurnOff', 'binarySwitchTurnOnOff', 'binarySwitchInvert', 'binarySwitchGetState',
    'meterResetCounter', 'meterGetLastValue', 'meterGetAllValues', 'meterGetUnits',
    'getConfiguration', 'setConfiguration', 'sensorMultiLevelGetUnits',
    'energyConsumptionMeterGetLastCost', 'sensorMultiLevelGetLabel', 'sensorMultiLevelGetUnits', 'sensorMultiLevelGetFormatted',
    'sensorMultiLevelGetValue', 'sensorMultiLevelGetHistory', 'setColorRingLevelStateId', 'getColorRingLevelStateId',
    'getStateId', 'setStateId', 'getStateBehavior', 'setStateBehavior', 'getForceBitmaskStatePosition', 'setForceBitmaskStatePosition',
    'getControlledBitmaskStatePosition', 'setControlledBitmaskStatePosition'],
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
    STATUS_FROM_SCENARIO_STATE: 2
  },
  colorStateIndexes: {
    none: 0,
    white: 3,
    red: 4,
    green: 5,
    blue: 6,
    yellow: 7,
    cyan: 8,
    purple: 9
  }
}

export default FibaroFgwpe102zw5
