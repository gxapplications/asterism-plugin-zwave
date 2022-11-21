'use strict'

import debounce from 'debounce'

import UnknownProduct from './unknown'
import CentralSceneSupport from './mixin-central-scene'
import BinarySwitchSupport from './mixin-binary-switch'

/*
  https://products.z-wavealliance.org/products/3980
  https://manuals.fibaro.com/smart-module/

  Data dump (triple click on S1):
    {"class_id":112,"instance":1,"index":1,"label":"Remember relays state","value":"Restore remembered state of relays after restoring power"}.
    {"class_id":112,"instance":1,"index":162,"label":"Q/Q1 output type","value":"Normally Open (relay contacts opened turned off, closed when turned on)"}.
    {"class_id":112,"instance":1,"index":163,"label":"Q2 output type","value":"Normally Open (relay contacts opened turned off, closed when turned on)"}.
    {"class_id":112,"instance":1,"index":164,"label":"Lock simultaneous switching of Q1 and Q2 outputs","value":"Lock disabled"}.
    {"class_id":112,"instance":1,"index":20,"label":"S1 input – switch type","value":"Toggle switch (device changes status when switch changes status)"}.
    {"class_id":112,"instance":1,"index":21,"label":"S2 input – switch type","value":"Toggle switch (device changes status when switch changes status)"}.
    {"class_id":112,"instance":1,"index":25,"label":"Inputs orientation","value":"default (S1 - 1st channel, S2 - 2nd channel)"}.
    {"class_id":112,"instance":1,"index":26,"label":"Outputs orientation","value":"default (Q1 - 1st channel, Q2 - 2nd channel)"}.

    {"class_id":37,"instance":1,"index":0,"label":"Instance 1: Switch","value":false}.
    {"class_id":37,"instance":2,"index":0,"label":"Instance 2: Switch","value":false}.

    {"class_id":113,"instance":1,"index":256,"label":"Previous Event Cleared","value":0}.
    {"class_id":113,"instance":1,"index":9,"label":"System","value":"Clear"}.


  S1 held down:
    {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Key Held down"}.
  S1 released:
    {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Key Released"}.

  S2 held down:
    {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Key Held down"}.
  S2 released:
    {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Key Released"}.

  S1 clicked (to turn ON Q1):
    {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Pressed 1 Time"}.
    {"class_id":37,"instance":1,"index":0,"label":"Instance 1: Switch","value":true}.
    {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Inactive"}.
  S1 clicked (to turn OFF Q1):
    {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Pressed 1 Time"}.
    {"class_id":37,"instance":1,"index":0,"label":"Instance 1: Switch","value":false}.
    {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Inactive"}.
  S2 clicked (to turn ON Q2):
    {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Pressed 1 Time"}.
    !!!!! MISSING TRAME HERE, AS EXPECTED LIKE FOR S1 !!!!
    {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Inactive"}.
  S2 clicked (to turn OFF Q2):
    {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Pressed 1 Time"}.
    !!!!! MISSING TRAME HERE, AS EXPECTED LIKE FOR S1 !!!!
    {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Inactive"}.

  S2 double clicked:
    {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Pressed 2 Times"}
  S1 triple clicked:
    {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Pressed 3 Times"}.
 */

const _centralSceneMapper = {
  1: (value) => (['Button S1', value]),
  2: (value) => (['Button S2', value]),
}

const q2Instance = 2 // Seems to change depending on the env... 2 or 3

class FibaroFgs224 extends UnknownProduct.with(
  CentralSceneSupport(_centralSceneMapper), // Adds button actions support
  BinarySwitchSupport(1, 0), // Adds On/Off switch features for Q1
  BinarySwitchSupport(q2Instance, 0), // Adds On/Off switch features for Q2, force polling as its not automatic
) {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.zwaveService = context.zwaveService
    this.logger = context.logger
    this.dataHandler = context.dataHandler
    this.privateSocketIo = context.privateSocketIo
    this.scenariiService = context.scenariiService

    const c = FibaroFgs224.meta.configurations
    this.requestConfigurations(
      c.REMEMBER_RELAYS_STATES,
      c.INPUT_TYPE_SWITCH_S1,
      c.INPUT_TYPE_SWITCH_S2,
      c.INPUTS_REVERSION,
      c.OUTPUTS_REVERSION,
      c.INPUT_SCENE_SENT_S1,
      c.INPUT_SCENE_SENT_S2,
      c.OUTPUT_TYPE_Q1,
      c.OUTPUT_TYPE_Q2,
      c.LOCK_SIMULTANEOUS_OUTPUTS
    )

    this.updateToBitmaskState(true)
    this.zwave.addAssociation(this.node.nodeid, 3, 1) // assuming controller is always node 1
    this._debouncedValueQ2 = { v: null, t: 0 }
    this.debouncedUpdateToBitmaskState = debounce(this.updateToBitmaskState.bind(this, false), 150, false)
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || FibaroFgs224.meta.name(this.node.nodeid)
  }

  classValueChanged (comClass, value) {
    switch (comClass) {
      case 37: // 0x25
        if (value.index === 0) { // index is 0 for this product
          this.getPairedNodeId().then((pairedNodeId) => {
            if (pairedNodeId) {
              const pairedNode = this.zwaveService.getNodeById(pairedNodeId)
              if (pairedNode && (value.value !== pairedNode.binarySwitchGetState(value.instance))) {
                pairedNode.binarySwitchTurnOnOff(!!value.value, value.instance)
              }
            }
          })

          this.debouncedUpdateToBitmaskState()
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
  }

  nodeEvent ([value, ...otherData]) {
    if ((Date.now() > (this._debouncedValueQ2.t + 500)) || (this._debouncedValueQ2.v !== value)) {
      this.zwave.refreshValue({ node_id: this.node.nodeid, class_id: 37, instance: q2Instance, index: 0 })

      this._debouncedValueQ2.v = value
      this._debouncedValueQ2.t = Date.now()
    }

    if (super.nodeEvent) {
      super.nodeEvent([value, ...otherData])
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

  updateToBitmaskState (initStage = false) {
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

        const valueQ1 = this.binarySwitchGetState(1)
        const valueQ2 = this.binarySwitchGetState(q2Instance)

        this.getStateBehavior()
        .then((stateBehavior) => {
          this.getForceBitmaskStatePosition()
          .then((forcedMode) => {
            this.getControlledBitmaskStatePosition()
            .then((controlledMode) => {
              const shiftQ1 = Math.abs(stateBehavior)
              const shiftQ2 = shiftQ1 * 2
              const way = (shiftQ1 == stateBehavior) // stateBehavior positive => true
              let newState = (valueQ1 ^ !way) ? (bitmaskState.state | shiftQ1) : (bitmaskState.state & ~shiftQ1)
              newState = (valueQ2 ^ !way) ? (newState | shiftQ2) : (newState & ~shiftQ2)

              if (bitmaskState.state === newState && !initStage) {
                return
              }

              if (this._forceBitmaskStateListenerId) {
                bitmaskState.removeListener(this._forceBitmaskStateListenerId)
              }

              if (forcedMode) {
                const listener = (state, s, oldState) => {}
                listener.preValidate = (state, s, oldState) => {
                  return ((state & shiftQ1) === (newState & shiftQ1)) && ((state & shiftQ2) === (newState & shiftQ2))
                }
                this._forceBitmaskStateListenerId = bitmaskState.addListener(listener)
              } else if (controlledMode) {
                const listener = (state, s, oldState) => {
                  // console.log('#1. nodeId=', this.node.nodeid, 'way=', way, ' shiftQ1=', shiftQ1, ' shiftQ2=', shiftQ2, ' newState=', newState, ' bitmaskState=', bitmaskState.state)
                  // console.log('#2. state=', state, ' oldState=', oldState)
                  // console.log('#3. (state & shiftQ1)=', (state & shiftQ1), ' (oldState & shiftQ1)=', (oldState & shiftQ1))
                  // console.log('#3b. (state & shiftQ2)=', (state & shiftQ2), ' (oldState & shiftQ2)=', (oldState & shiftQ2))
                  if (((state & shiftQ1) === (oldState & shiftQ1)) && ((state & shiftQ2) === (oldState & shiftQ2))) {
                    // console.log('#4. STOP')
                    return
                  }

                  // console.log('#4. CONTINUE')
                  const stateIsOnQ1 = (state & shiftQ1) === shiftQ1
                  const stateIsOnQ2 = (state & shiftQ2) === shiftQ2
                  const productIsOnQ1 = this.binarySwitchGetState(1)
                  const productIsOnQ2 = this.binarySwitchGetState(q2Instance)

                  if (way && (stateIsOnQ1 !== productIsOnQ1)) {
                    this.binarySwitchTurnOnOff(stateIsOnQ1, 1)
                  } else if (!way && (stateIsOnQ1 === productIsOnQ1)) {
                    this.binarySwitchTurnOnOff(!stateIsOnQ1, 1)
                  }

                  if (way && (stateIsOnQ2 !== productIsOnQ2)) {
                    this.binarySwitchTurnOnOff(stateIsOnQ2, q2Instance)
                  } else if (!way && (stateIsOnQ2 === productIsOnQ2)) {
                    this.binarySwitchTurnOnOff(!stateIsOnQ2, q2Instance)
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

  getPairedNodeId () {
    if (this.node.pairedNodeId) {
      return Promise.resolve(this.node.pairedNodeId)
    }
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (item) {
        this.node.pairedNodeId = item.pairedNodeId
        return item.pairedNodeId
      }
      return true
    })
    .catch((error) => {
      console.log(error)
      return true
    })
  }

  setPairedNodeId (pairedNodeId) {
    this.node.pairedNodeId = pairedNodeId
    return this.dataHandler.getItem(`zwave-node-${this.node.nodeid}-data`)
    .then((item) => {
      if (!item) {
        item = {}
      }
      item.pairedNodeId = pairedNodeId
      return item
    })
    .then((item) => this.dataHandler.setItem(`zwave-node-${this.node.nodeid}-data`, item))
    .catch(console.error)
  }
}

FibaroFgs224.meta = {
  name: (nodeid) => `Double On/Off switch module #${nodeid} (FIBARO Double smart module)`,
  manufacturer: 'FIBARO System',
  manufacturerid: '0x010f',
  product: 'FGS-224',
  producttype: '0x0204',
  productid: '0x1000',
  type: 'Double smart module',
  passive: false,
  battery: false,
  icon: 'FibaroFgs224',
  settingPanel: 'fibaro-fgs224',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation', 'centralSceneGetLabel',
    'binarySwitchTurnOn', 'binarySwitchTurnOff', 'binarySwitchTurnOnOff', 'binarySwitchInvert', 'binarySwitchGetState', 'binarySwitchGetSupportedInstances',
    'getConfiguration', 'setConfiguration', 'getStateId', 'setStateId', 'getStateBehavior', 'setStateBehavior',
    'getForceBitmaskStatePosition', 'setForceBitmaskStatePosition', 'getControlledBitmaskStatePosition', 'setControlledBitmaskStatePosition',
    'getPairedNodeId', 'setPairedNodeId'],
  configurations: {
    REMEMBER_RELAYS_STATES: 1,
    /**
     * Default 1
     * 0 – relays remain switched off after restoring power
     * 1 – restore remembered state of relays after restoring power
     * 2 – restore remembered state of relays after restoring power, but for toggle switches (parameter 20/21 set to 1) set the same state as the current state of the switches
     */
    INPUT_TYPE_SWITCH_S1: 20,
    /**
     * 0 – momentary switch (default)
     * 1 – toggle switch synchronized (contact closed – ON, contact opened – OFF)
     * 2 – toggle switch with memory (device changes status when switch changes status)
     */
    INPUT_TYPE_SWITCH_S2: 21,
    /** SAME AS 20 */
    INPUTS_REVERSION: 24,
    /**
     * 0 – default (S1 – 1st channel, S2 – 2nd channel)
     * 1 – reversed (S1 – 2nd channel, S2 – 1st channel)
     */
    OUTPUTS_REVERSION: 25,
    /**
     * 0 – default (Q1 – 1st channel, Q2 – 2nd channel)
     * 1 – reversed (Q1 – 2nd channel, Q2 – 1st channel)
     */
    // 30, 31,32,33,34,35 NOT SUPPORTED : alarm behaviors
    INPUT_SCENE_SENT_S1: 40,
    /**
     * Default mask 15
     * 0 – no scenes sent
     * 1 – Key pressed 1 time
     * 2 – Key pressed 2 times
     * 4 – Key pressed 3 times
     * 8 – Key hold down and key released
     */
    INPUT_SCENE_SENT_S2: 41,
    /** SAME AS 40 */
    // 150, 151, 152, 153, 154, 155 NOT SUPPORTED : output behavior (auto/delay OFF, flashing)
    // 156, 157, 158, 159, 160, 161 NOT SUPPORTED : values sent to association groups
    OUTPUT_TYPE_Q1: 162,
    /**
     * Default 0
     * 0 – Normally Open (relay contacts opened when off, closed when on)
     * 1 – Normally Closed (relay contacts closed when off, opened when on)
     */
    OUTPUT_TYPE_Q2: 163,
    /** SAME AS 162 */
    LOCK_SIMULTANEOUS_OUTPUTS: 164
    /**
     * Default 0 (disabled)
     * 1 - both outputs cannot be turned on at the same time
     */
  },
  centralSceneMapper: _centralSceneMapper
}

export default FibaroFgs224
