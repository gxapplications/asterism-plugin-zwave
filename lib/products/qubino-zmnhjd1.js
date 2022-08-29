'use strict'

import UnknownProduct from './unknown'
import MultiLevelSwitchSupport from "./mixin-multi-level-switch";
import NameLocationFromDataSupport from './mixin-name-location-from-data'

/*
  COMMAND_CLASS_SWITCH_MULTILEVEL:
    {"class_id":38,"instance":1,"index":0,"label":"Level","value":0}.
    {"class_id":38,"instance":1,"index":1,"label":"Bright"}.
    {"class_id":38,"instance":1,"index":2,"label":"Dim"}.
    {"class_id":38,"instance":1,"index":3,"label":"Ignore Start Level","value":true}.
    {"class_id":38,"instance":1,"index":4,"label":"Start Level","value":0}.
  {"class_id":38,"instance":1,"index":0,"label":"Level","value":20}.

  COMMAND_CLASS_SWITCH_ALL:
    {"class_id":39,"instance":1,"index":0,"label":"Switch All","value":"Disabled"}.
    {"class_id":39,"instance":1,"index":0,"label":"Switch All","value":"On and Off Enabled"}.

  COMMAND_CLASS_CONFIGURATION:
    {"class_id":112,"instance":1,"index":1,"label":"Input 1 switch type","value":"Bi-stable switch type"}.
    {"class_id":112,"instance":1,"index":2,"label":"Input 2 switch type","value":"Bi-stable switch type"}.
    {"class_id":112,"instance":1,"index":3,"label":"Input 3 switch type","value":"Bi-stable switch type"}.
    {"class_id":112,"instance":1,"index":4,"label":"Input 1 contact type","value":"NO (normally open) input type"}.
    {"class_id":112,"instance":1,"index":5,"label":"Input 2 contact type","value":"NO (normally open) input type"}.
    {"class_id":112,"instance":1,"index":6,"label":"Input 3 contact type","value":"NO (normally open) input type"}.
    {"class_id":112,"instance":1,"index":11,"label":"Input 1 Functionality selection","value":"Confort"}.
    {"class_id":112,"instance":1,"index":12,"label":"Input 2 Functionality selection","value":"Eco"}.
    {"class_id":112,"instance":1,"index":13,"label":"Input 3 Functionality selection","value":"Hors-Gel"}.
  {"class_id":112,"instance":1,"index":30,"label":"Saving the state of the relay after a power failure","value":"Flush dimmer module saves its state before power failure (it returns to the last position saved before a power failure)"}.

  COMMAND_CLASS_POWERLEVEL:
    {"class_id":115,"instance":1,"index":0,"label":"Powerlevel","value":"Normal"}.
    {"class_id":115,"instance":1,"index":1,"label":"Timeout","value":0}.
    {"class_id":115,"instance":1,"index":2,"label":"Set Powerlevel"}.
    {"class_id":115,"instance":1,"index":3,"label":"Test Node","value":0}.
    {"class_id":115,"instance":1,"index":4,"label":"Test Powerlevel","value":"Normal"}.
    {"class_id":115,"instance":1,"index":5,"label":"Frame Count","value":0}.
    {"class_id":115,"instance":1,"index":6,"label":"Test"}.
    {"class_id":115,"instance":1,"index":7,"label":"Report"}.
    {"class_id":115,"instance":1,"index":8,"label":"Test Status","value":"Failed"}.
    {"class_id":115,"instance":1,"index":9,"label":"Acked Frames","value":0}.
    {"class_id":115,"instance":1,"index":0,"label":"Powerlevel","value":"Normal"}.
    {"class_id":115,"instance":1,"index":1,"label":"Timeout","value":0}.

  COMMAND_CLASS_SWITCH_BINARY:
    {"class_id":37,"instance":1,"index":0,"label":"Switch","value":false}.
    {"class_id":37,"instance":1,"index":0,"label":"Switch","value":true}.

  COMMAND_CLASS_SENSOR_BINARY:
    {"class_id":48,"instance":1,"index":0,"label":"Sensor","value":false}.
    {"class_id":48,"instance":2,"index":0,"label":"Instance 2: Sensor","value":false}.
    {"class_id":48,"instance":3,"index":0,"label":"Instance 3: Sensor","value":false}.
    {"class_id":48,"instance":1,"index":0,"label":"Instance 1: Sensor","value":false}.
    {"class_id":48,"instance":1,"index":0,"label":"Instance 1: Sensor","value":false}.
    {"class_id":48,"instance":1,"index":0,"label":"Instance 1: Sensor","value":false}.

  COMMAND_CLASS_SENSOR_MULTILEVEL:
    {"class_id":49,"instance":1,"index":1,"label":"Temperature","value":"-999.9"}.
    {"class_id":49,"instance":1,"index":1,"label":"Temperature","value":"-999.9"}.
 */

class QubinoZmnhjd1 extends UnknownProduct.with(
  NameLocationFromDataSupport(), // store name and location in DB (not supported by node itself)
  MultiLevelSwitchSupport(1, 0, { minLevel: 0, maxLevel: 99 })) {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.dataHandler = context.dataHandler
    this.privateSocketIo = context.privateSocketIo
    this.scenariiService = context.scenariiService

    this.updateToLevelState()
  }

  getName () {
    return super.getName() || QubinoZmnhjd1.meta.name(this.node.nodeid)
  }

  classValueChanged (comClass, value) {
    if (value.instance !== 1) {
      return // only 1 instance available on this product
    }

    switch (comClass) {
      case 38: // 0x26
        if (value.index === 0 && value.instance === 1) {
          this.updateToLevelState() // cannot use value.value as it's not the same scale.
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
  }

  multiLevelSwitchGetPercent () {
    const level = super.multiLevelSwitchGetPercent();
    if (level <= 10) {
      return 0
    }
    if (level <= 20) {
      return 15
    }
    if (level <= 30) {
      return 25
    }
    if (level <= 40) {
      return 35
    }
    if (level <= 50) {
      return 45
    }
    return 100
  }

  pilotWireGetLevel () {
    const level = super.multiLevelSwitchGetPercent();
    if (level <= 10) {
      return 0
    }
    if (level <= 20) {
      return 1
    }
    if (level <= 30) {
      return 2
    }
    if (level <= 40) {
      return 3
    }
    if (level <= 50) {
      return 4
    }
    return 5
  }

  pilotWireSetLevel (level) {
    if (level === 0) {
      return this.multiLevelSwitchSetPercent(0);
    }
    if (level === 1) {
      return this.multiLevelSwitchSetPercent(15);
    }
    if (level === 2) {
      return this.multiLevelSwitchSetPercent(25);
    }
    if (level === 3) {
      return this.multiLevelSwitchSetPercent(35);
    }
    if (level === 4) {
      return this.multiLevelSwitchSetPercent(45);
    }
    return this.multiLevelSwitchSetPercent(100);
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

  setStateId (stateId) {
    this.node.stateId = stateId
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (!item) {
        item = {}
      }
      item.stateId = stateId
      return item
    })
    .then((item) => this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item))
    .then(() => {
      this.updateToLevelState()
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
        this.node.stateBehavior = item.stateBehavior || 'follow'
        return item.stateBehavior || 'follow'
      }
      return 'follow'
    })
    .catch((error) => {
      console.log(error)
      return 'follow'
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
      this.updateToLevelState()
    })
    .catch(console.error)
  }

  updateToLevelState (value) {
    return this.getStateId()
    .then((stateId) => {
      if (!stateId) {
        return
      }

      return this.scenariiService.getStateInstance(stateId)
      .then((levelState) => {
        if (!levelState) {
          return
        }

        if (value === undefined) {
          value = this.pilotWireGetLevel() // values: 0 to 5, Off, frost free, eco, comfort-2, comfort-1, comfort
        }

        this.getStateBehavior()
        .then((stateBehavior) => {
          if (this._forceLevelStateListenerId) {
            levelState.removeListener(this._forceLevelStateListenerId)
          }

          if (stateBehavior === 'follow') { // product follows state change
            const listener = (state, s, oldState) => {
              if (state <= 6 && state !== oldState && state !== (this.pilotWireGetLevel() + 1)) {
                this.pilotWireSetLevel(state - 1);
              }
            }
            this._forceLevelStateListenerId = levelState.addListener(listener)
            return // do not execute code after that, because just 'follow' mode, must not update levelState from product!
          } else if (stateBehavior === 'force') { // product is the only one allowed to change state level.
            const listener = (state, s, oldState) => {}
            listener.preValidate = (state, s, oldState) => {
              return state === value + 1
            }
            this._forceLevelStateListenerId = levelState.addListener(listener)
          } else if (stateBehavior === 'controlled') {
            const listener = (state, s, oldState) => {
              if (state <= 6 && state !== oldState && state !== (this.pilotWireGetLevel() + 1)) {
                this.pilotWireSetLevel(state - 1);
              }
            }
            listener.preValidate = () => true
            this._forceLevelStateListenerId = levelState.addListener(listener)
            // no return statement here: must update levelState too !
          }

          // update levelState if needed
          if (levelState.state !== value + 1) {
            levelState.state = value + 1
          }
        })
      })
    })
  }
}

QubinoZmnhjd1.meta = {
  name: (nodeid) => `Pilot wire #${nodeid} (Qubino Flush Dimmer Pilot Wire)`,
  manufacturer: 'GOAP Qubino',
  manufacturerid: '0x0159',
  product: 'Flush Dimmer Pilot Wire ZMNHJD1',
  producttype: '0x0004',
  productid: '0x0051',
  type: 'Pilot wire controller',
  passive: false,
  battery: false,
  icon: 'QubinoZmnhjd1',
  settingPanel: 'qubino-zmnhjd1',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation',
    'getStateId', 'setStateId', 'getStateBehavior', 'setStateBehavior','getConfiguration', 'setConfiguration', 'pilotWireGetLevel', 'pilotWireSetLevel',
    'multiLevelSwitchSetPercent', 'multiLevelSwitchSetValue', 'multiLevelSwitchGetPercent', 'multiLevelSwitchGetValue'],
  configurations: {}
}

export default QubinoZmnhjd1
