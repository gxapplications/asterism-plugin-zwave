'use strict'

import UnknownProduct from './unknown'
import BatteryLevelSupport from './mixin-battery-level'
import CentralSceneSupport from './mixin-central-scene'

// Doc found:
// https://products.z-wavealliance.org/products/1968
// http://manuals-backend.z-wave.info/make.php?lang=en&sku=HKZW-SCN04&cert=ZC10-16095219
// https://Products.Z-WaveAlliance.org/ProductManual/File?folder=&filename=Manuals/1968/HKZW-SCN04 Manual.pdf

/* Frames for retro-engineering

 If needed for later investigation, these cmd classes could be managed:
 class 132, {"type":"int",   "genre":"system","instance":1,"index":1,    "label":"Minimum Wake-up Interval","units":"Seconds","help":"","read_only":true,"write_only":false,"min":-2147483648,"max":2147483647,"is_polled":false,"value":0}.
 class 132, {"type":"int",   "genre":"system","instance":1,"index":2,    "label":"Maximum Wake-up Interval","units":"Seconds","help":"","read_only":true,"write_only":false,"min":-2147483648,"max":2147483647,"is_polled":false,"value":0}.
 class 132, {"type":"int",   "genre":"system","instance":1,"index":3,    "label":"Default Wake-up Interval","units":"Seconds","help":"","read_only":true,"write_only":false,"min":-2147483648,"max":2147483647,"is_polled":false,"value":0}.
 class 132, {"type":"int",   "genre":"system","instance":1,"index":4,    "label":"Wake-up Interval Step","units":"Seconds","help":"","read_only":true,"write_only":false,"min":-2147483648,"max":2147483647,"is_polled":false,"value":0}.

 Other stuff:
 'value added/changed events' : class 38,  {"type":"byte",  "genre":"user","instance":1,"index":0,      "label":"Level","units":"","help":"","read_only":false,"write_only":false,"min":0,"max":255,"is_polled":false,"value":0}.
 'value added/changed events' : class 38,  {"type":"button","genre":"user","instance":1,"index":1,      "label":"Bright","units":"","help":"","read_only":false,"write_only":true,"min":0,"max":0,"is_polled":false}.
 'value added/changed events' : class 38,  {"type":"button","genre":"user","instance":1,"index":2,      "label":"Dim","units":"","help":"","read_only":false,"write_only":true,"min":0,"max":0,"is_polled":false}.
 'value added/changed events' : class 38,  {"type":"bool",  "genre":"system","instance":1,"index":3,    "label":"Ignore Start Level","units":"","help":"","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"value":true}.
 'value added/changed events' : class 38,  {"type":"byte",  "genre":"system","instance":1,"index":4,    "label":"Start Level","units":"","help":"","read_only":false,"write_only":false,"min":0,"max":255,"is_polled":false,"value":0}.
 controller command feedback: nodeId=0, ctrlState=1, ctrlError=0, helpmsg=NaN
 controller command feedback: nodeId=0, ctrlState=6, ctrlError=0, helpmsg=NaN
 controller command feedback: nodeId=0, ctrlState=7, ctrlError=0, helpmsg=NaN
 controller command feedback: nodeId=0, ctrlState=1, ctrlError=0, helpmsg=NaN
 controller command feedback: nodeId=0, ctrlState=6, ctrlError=0, helpmsg=NaN
 controller command feedback: nodeId=0, ctrlState=7, ctrlError=0, helpmsg=NaN
 'notification event' for node #3: timeout.
 'notification event' for node #3: sleep.

 Battery:
 class 128, {"type":"byte",  "genre":"user","instance":1,"index":0,      "label":"Battery Level","units":"%","help":"","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":100}.


 Central scene buttons, simgle click:

 Central button 'O':
 'value added/changed events' : class 91, {"value_id":"4-91-1-1","node_id":4,"class_id":91,"type":"list","genre":"user","instance":1,"index":1,"label":"","units":"","help":"Scene KeyAttribute","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"values":["Pressed 1 Time","Key Released","Key Held down","Pressed 2 Times","Pressed 3 Times","Pressed 4 Times","Pressed 5 Times"],"value":"Pressed 1 Time"}.
 'value added/changed events' : class 91, {"value_id":"4-91-1-2","node_id":4,"class_id":91,"type":"byte","genre":"user","instance":1,"index":2,"label":"","units":"","help":"Scene ID","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":3}.
 'value added/changed events' : class 91, {"value_id":"4-91-1-128","node_id":4,"class_id":91,"type":"byte","genre":"user","instance":1,"index":128,"label":"","units":"","help":"Scene Number","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":30}.

 Bottom button 'power':
 'value added/changed events' : class 91, {"value_id":"4-91-1-1","node_id":4,"class_id":91,"type":"list","genre":"user","instance":1,"index":1,"label":"","units":"","help":"Scene KeyAttribute","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"values":["Pressed 1 Time","Key Released","Key Held down","Pressed 2 Times","Pressed 3 Times","Pressed 4 Times","Pressed 5 Times"],"value":"Pressed 1 Time"}.
 'value added/changed events' : class 91, {"value_id":"4-91-1-2","node_id":4,"class_id":91,"type":"byte","genre":"user","instance":1,"index":2,"label":"","units":"","help":"Scene ID","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":4}.
 'value added/changed events' : class 91, {"value_id":"4-91-1-128","node_id":4,"class_id":91,"type":"byte","genre":"user","instance":1,"index":128,"label":"","units":"","help":"Scene Number","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":40}.

 Right button 'people':
 'value added/changed events' : class 91, {"value_id":"4-91-1-1","node_id":4,"class_id":91,"type":"list","genre":"user","instance":1,"index":1,"label":"","units":"","help":"Scene KeyAttribute","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"values":["Pressed 1 Time","Key Released","Key Held down","Pressed 2 Times","Pressed 3 Times","Pressed 4 Times","Pressed 5 Times"],"value":"Pressed 1 Time"}.
 'value added/changed events' : class 91, {"value_id":"4-91-1-2","node_id":4,"class_id":91,"type":"byte","genre":"user","instance":1,"index":2,"label":"","units":"","help":"Scene ID","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":2}.
 'value added/changed events' : class 91, {"value_id":"4-91-1-128","node_id":4,"class_id":91,"type":"byte","genre":"user","instance":1,"index":128,"label":"","units":"","help":"Scene Number","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":20}.

 left button 'moon':
 'value added/changed events' : class 91, {"value_id":"4-91-1-1","node_id":4,"class_id":91,"type":"list","genre":"user","instance":1,"index":1,"label":"","units":"","help":"Scene KeyAttribute","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"values":["Pressed 1 Time","Key Released","Key Held down","Pressed 2 Times","Pressed 3 Times","Pressed 4 Times","Pressed 5 Times"],"value":"Pressed 1 Time"}.
 'value added/changed events' : class 91, {"value_id":"4-91-1-2","node_id":4,"class_id":91,"type":"byte","genre":"user","instance":1,"index":2,"label":"","units":"","help":"Scene ID","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":1}.
 'value added/changed events' : class 91, {"value_id":"4-91-1-128","node_id":4,"class_id":91,"type":"byte","genre":"user","instance":1,"index":128,"label":"","units":"","help":"Scene Number","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":10}.

 Central scene buttons, double click on central button 'O':
 Seems to be like single click:: value still "Pressed 1 Time"

 Central scene buttons, long click (1.5~2s) on central button 'O':
 'value added/changed events' : class 91, {"value_id":"4-91-1-1","node_id":4,"class_id":91,"type":"list","genre":"user","instance":1,"index":1,"label":"","units":"","help":"Scene KeyAttribute","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"values":["Pressed 1 Time","Key Released","Key Held down","Pressed 2 Times","Pressed 3 Times","Pressed 4 Times","Pressed 5 Times"],"value":"Key Held down"}.
 'value added/changed events' : class 91, {"value_id":"4-91-1-2","node_id":4,"class_id":91,"type":"byte","genre":"user","instance":1,"index":2,"label":"","units":"","help":"Scene ID","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":3}.
 'value added/changed events' : class 91, {"value_id":"4-91-1-128","node_id":4,"class_id":91,"type":"byte","genre":"user","instance":1,"index":128,"label":"","units":"","help":"Scene Number","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":32}.
 Then when released:
 'value added/changed events' : class 91, {"value_id":"4-91-1-1","node_id":4,"class_id":91,"type":"list","genre":"user","instance":1,"index":1,"label":"","units":"","help":"Scene KeyAttribute","read_only":false,"write_only":false,"min":0,"max":0,"is_polled":false,"values":["Pressed 1 Time","Key Released","Key Held down","Pressed 2 Times","Pressed 3 Times","Pressed 4 Times","Pressed 5 Times"],"value":"Key Released"}.
 'value added/changed events' : class 91, {"value_id":"4-91-1-2","node_id":4,"class_id":91,"type":"byte","genre":"user","instance":1,"index":2,"label":"","units":"","help":"Scene ID","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":3}.
 'value added/changed events' : class 91, {"value_id":"4-91-1-128","node_id":4,"class_id":91,"type":"byte","genre":"user","instance":1,"index":128,"label":"","units":"","help":"Scene Number","read_only":true,"write_only":false,"min":0,"max":255,"is_polled":false,"value":31}.

 Central scene buttons, triple, quadruples click on central button 'O':
 Triggers another type of event, no class 91!
 */

// TODO !0: test it and fix it after openzwave migration
const _centralSceneMapper = {
  // index 128 for cmdClass 91 contains both btn# and action type data. Use only this one for this product
  128: (value) => ([`Button #${`${value}`.charAt(0)}`, ["Pressed 1 Time", "Key Released", "Key Held down"][value % 10]])
}

class HankHkzwscn04 extends UnknownProduct.with(
    BatteryLevelSupport(0, { minLevel: 0, maxLevel: 100 }), // Adds battery level support
    CentralSceneSupport(_centralSceneMapper)) { // Adds button actions support

  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.scenariiService = context.scenariiService
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || HankHkzwscn04.meta.name(this.node.nodeid)
  }
}

HankHkzwscn04.meta = {
  name: (nodeid) => `Scene controller #${nodeid} (Hank, 4 buttons)`,
  manufacturer: 'Hank',
  manufacturerid: '0x0208',
  product: 'HKZW-SCN04',
  producttype: '0x0200',
  productid: '0x000B',
  type: 'Wall Controller',
  passive: true,
  battery: true,
  icon: 'HankHkzwscn04',
  settingPanel: 'hank-hkzwscn04',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation', 'batteryLevelGetPercent', 'batteryLevelGetIcon', 'centralSceneGetLabel'],
  configurations: { },
  centralSceneMapper: _centralSceneMapper
}

export default HankHkzwscn04
