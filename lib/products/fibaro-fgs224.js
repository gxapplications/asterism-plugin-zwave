'use strict'

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
    ####### MISSING TRAME HERE, AS EXPECTED LIKE FOR S1 !!!!
    {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Inactive"}.
  S2 clicked (to turn OFF Q2):
    {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Pressed 1 Time"}.
    ####### MISSING TRAME HERE, AS EXPECTED LIKE FOR S1 !!!!
    {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Inactive"}.

  S2 double clicked:
    {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Pressed 2 Times"}
  S1 triple clicked:
    {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Pressed 3 Times"}.

  TODO !2: corriger BinarySwitchStateCondition et BinarySwitchStateTrigger et BinarySwitchAction pour qu'ils supportent instance = 2/3 !
 */

const _centralSceneMapper = {
  1: (value) => (['Button S1', value]),
  2: (value) => (['Button S2', value]),
}

const q2Instance = 2 // Seems to change depending on the env... 2 or 3

class FibaroFgs224 extends UnknownProduct.with(
  CentralSceneSupport(_centralSceneMapper), // Adds button actions support
  BinarySwitchSupport(1, 0), // Adds On/Off switch features for Q1
  BinarySwitchSupport(q2Instance, 0, true), // Adds On/Off switch features for Q2, force polling as its not automatic
) {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
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
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || FibaroFgs224.meta.name(this.node.nodeid)
  }

  classValueChanged (comClass, value) {
    switch (comClass) {
      case 91: // 0x5B
        // As Q2 change is not made auto (but by manual polling), must force an update when S2 is pressed 1 time.
        if (value.index === 2 && value.value === value.values[1]) { // "Pressed 1 Time"
          this.zwave.refreshValue({ node_id: this.node.nodeid, class_id: 37, instance: q2Instance, index: 0 })
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
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
    'getConfiguration', 'setConfiguration'],
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
