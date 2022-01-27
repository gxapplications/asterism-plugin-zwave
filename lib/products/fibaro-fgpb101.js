'use strict'

import UnknownProduct from './unknown'
import BatteryLevelSupport from './mixin-battery-level'
import CentralSceneSupport from './mixin-central-scene'

/*
  https://products.z-wavealliance.org/products/1944?selectedFrequencyId=1

  What is the purpose of class 132 ? Maybe can make this a specific configuration ? (several products impacted)
  {"class_id":132,"instance":1,"index":0,"label":"Wake-up Interval","value":3600}.
  {"class_id":132,"instance":1,"index":0,"label":"Wake-up Interval","value":0}.
  {"class_id":132,"instance":1,"index":1,"label":"Minimum Wake-up Interval","value":0}.
  {"class_id":132,"instance":1,"index":2,"label":"Maximum Wake-up Interval","value":64800}.
  {"class_id":132,"instance":1,"index":3,"label":"Default Wake-up Interval","value":0}.
  {"class_id":132,"instance":1,"index":4,"label":"Wake-up Interval Step","value":3600}.
  {"class_id":132,"instance":1,"index":0,"label":"Wake-up Interval","value":0}.

  WHEN click 1 time, got:
  {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Pressed 1 Time"}.
  {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Inactive"}.

  WHEN click 3 times, got:
  {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Pressed 3 Times"}.
  {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Inactive"}.

  WHEN hold, then released:
  {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Key Held down"}.
  {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Inactive"}.
  {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Key Released"}.
  {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Inactive"}.

 */

const _centralSceneMapper = {
  1: (value) => (['Button', value])
}

class FibaroFgpb101 extends UnknownProduct.with(
  BatteryLevelSupport(0, { minLevel: 0, maxLevel: 100 }), // Adds battery level support
  CentralSceneSupport(_centralSceneMapper)) { // Adds button actions support

  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave

    const c = FibaroFgpb101.meta.configurations
    this.requestConfigurations(
      c.CENTRAL_SCENES_SENT
    )
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || FibaroFgpb101.meta.name(this.node.nodeid)
  }
}

FibaroFgpb101.meta = {
  name: (nodeid) => `Scene controller #${nodeid} (Fibaro The Button)`,
  manufacturer: 'FIBARO System',
  manufacturerid: '0x010f',
  product: 'FGPB-101',
  producttype: '0x0f01',
  productid: '0x1000',
  type: 'Wall Controller',
  passive: true,
  battery: true,
  icon: 'FibaroFgpb101',
  settingPanel: 'fibaro-fgpb101',
  settingPanelProvidedFunctions: [
    'getName', 'getLocation', 'setName', 'setLocation', 'batteryLevelGetPercent', 'batteryLevelGetIcon',
    'centralSceneGetLabel', 'getConfiguration', 'setConfiguration'
  ],
  configurations: {
    CENTRAL_SCENES_SENT: 1
  }
}

export default FibaroFgpb101
