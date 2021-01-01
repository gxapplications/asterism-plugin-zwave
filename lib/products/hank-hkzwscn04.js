'use strict'

import UnknownProduct from './unknown'
import BatteryLevelSupport from './mixin-battery-level'
import CentralSceneSupport from './mixin-central-scene'
import NameLocationFromDataSupport from './mixin-name-location-from-data'

// Doc found:
// https://products.z-wavealliance.org/products/1968
// http://manuals-backend.z-wave.info/make.php?lang=en&sku=HKZW-SCN04&cert=ZC10-16095219
// https://Products.Z-WaveAlliance.org/ProductManual/File?folder=&filename=Manuals/1968/HKZW-SCN04 Manual.pdf

/* Frames for retro-engineering

 If needed for later investigation, these cmd classes could be managed:
   {"class_id":132,"instance":1,"index":0,"label":"Wake-up Interval","value":0}.
   {"class_id":132,"instance":1,"index":1,"label":"Minimum Wake-up Interval","value":0}.
   {"class_id":132,"instance":1,"index":2,"label":"Maximum Wake-up Interval","value":0}.
   {"class_id":132,"instance":1,"index":3,"label":"Default Wake-up Interval","value":0}.
   {"class_id":132,"instance":1,"index":4,"label":"Wake-up Interval Step","value":0}.

 Other stuff:
   {"class_id":38,"instance":1,"index":1,"label":"Bright"}.
   {"class_id":38,"instance":1,"index":2,"label":"Dim"}.
   {"class_id":38,"instance":1,"index":3,"label":"Ignore Start Level","value":true}.
   {"class_id":38,"instance":1,"index":4,"label":"Start Level","value":0}.

   {"class_id":91,"instance":1,"index":256,"label":"Scene Count","value":0}.
   {"class_id":91,"instance":1,"index":257,"label":"Scene Reset Timeout","value":1000}.
   {"class_id":115,"instance":1,"index":0,"label":"Powerlevel","value":"Normal"}.

   {"class_id":91,"instance":1,"index":256,"label":"Scene Count","value":4}.
   {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Inactive"}.
   {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Inactive"}.
   {"class_id":91,"instance":1,"index":3,"label":"Scene 3","value":"Inactive"}.
   {"class_id":91,"instance":1,"index":4,"label":"Scene 4","value":"Inactive"}.

 Battery:
   {"class_id":128,"instance":1,"index":0,"label":"Battery Level","value":49}.


 Central scene buttons, single click:

   Central button 'O':
     {"class_id":91,"instance":1,"index":3,"label":"Scene 3","value":"Pressed 1 Time"}.
     {"class_id":91,"instance":1,"index":3,"label":"Scene 3","value":"Inactive"}.

   Bottom button 'power':
     {"class_id":91,"instance":1,"index":4,"label":"Scene 4","value":"Pressed 1 Time"}.
     {"class_id":91,"instance":1,"index":4,"label":"Scene 4","value":"Inactive"}.

   Right button 'people':
     {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Pressed 1 Time"}.
     {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Inactive"}.

   left button 'moon':
   {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Pressed 1 Time"}.
   {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Inactive"}.


 Central scene buttons, double click on central button 'O':
   Seems to be like single click:: value still "Pressed 1 Time"

 Central scene buttons, long click (1.5~2s) on central button 'O':
   {"class_id":91,"instance":1,"index":3,"label":"Scene 3","value":"Key Held down"}.

 Then when released:
   {"class_id":91,"instance":1,"index":3,"label":"Scene 3","value":"Key Released"}.
   {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Inactive"}.

 Central scene buttons, triple, quadruples click on central button 'O':
   Triggers another type of event, no class 91!

 */

const _centralSceneMapper = {
  1: (value) => (['Button #1 (night)', value]),
  2: (value) => (['Button #2 (user)', value]),
  3: (value) => (['Button #3 (central)', value]),
  4: (value) => (['Button #4 (power)', value])
}

class HankHkzwscn04 extends UnknownProduct.with(
  NameLocationFromDataSupport(), // store name and location in DB (not supported by node itself)
  BatteryLevelSupport(0, { minLevel: 0, maxLevel: 100 }), // Adds battery level support
  CentralSceneSupport(_centralSceneMapper)) { // Adds button actions support

  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.scenariiService = context.scenariiService
  }

  getName () {
    return super.getName() || HankHkzwscn04.meta.name(this.node.nodeid)
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
