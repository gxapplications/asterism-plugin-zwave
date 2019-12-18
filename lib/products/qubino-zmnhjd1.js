'use strict'

import UnknownProduct from './unknown'
import MultiLevelSwitchSupport from "./mixin-multi-level-switch";

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
    MultiLevelSwitchSupport(1, 0, { minLevel: 0, maxLevel: 99 })) {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.dataHandler = context.dataHandler
    this.privateSocketIo = context.privateSocketIo
    this.scenariiService = context.scenariiService
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || QubinoZmnhjd1.meta.name(this.node.nodeid)
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
    'getConfiguration', 'setConfiguration',
    'multiLevelSwitchSetPercent', 'multiLevelSwitchSetValue', 'multiLevelSwitchGetPercent', 'multiLevelSwitchGetValue'],
  configurations: {}
}

export default QubinoZmnhjd1
