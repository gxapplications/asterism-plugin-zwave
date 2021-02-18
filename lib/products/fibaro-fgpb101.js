'use strict'

import UnknownProduct from './unknown'
import BatteryLevelSupport from './mixin-battery-level'

/*
  https://products.z-wavealliance.org/products/1944?selectedFrequencyId=1

  TODO !0: to support, configurations:
   - index 0: Wake up interval, Available settings: 0 or 3600-64800 (in seconds, 1h - 18h), Default setting: 0
   - index 1: scenes sent to controller (determines which actions result in sending scene.
     Available settings:
      1 - Key Pressed 1 time
      2 - Key Pressed 2 times
      4 - Key Pressed 3 times
      8 - Key Pressed 4 times
      16 - Key Pressed 5 times
      32 - Key Held Down
      64 - Key Released
      Default setting: 127 (all)

  TODO !1: what is the purpose of class 132 ?
  {"class_id":132,"instance":1,"index":0,"label":"Wake-up Interval","value":3600}.
  {"class_id":132,"instance":1,"index":0,"label":"Wake-up Interval","value":0}.
  {"class_id":132,"instance":1,"index":1,"label":"Minimum Wake-up Interval","value":0}.
  {"class_id":132,"instance":1,"index":2,"label":"Maximum Wake-up Interval","value":64800}.
  {"class_id":132,"instance":1,"index":3,"label":"Default Wake-up Interval","value":0}.
  {"class_id":132,"instance":1,"index":4,"label":"Wake-up Interval Step","value":3600}.
  {"class_id":132,"instance":1,"index":0,"label":"Wake-up Interval","value":0}.

  TODO !1: what is the behavior of class 91 ?
  {"class_id":91,"instance":1,"index":256,"label":"Scene Count","value":0}.
  {"class_id":91,"instance":1,"index":257,"label":"Scene Reset Timeout","value":1000}.
  {"class_id":91,"instance":1,"index":256,"label":"Scene Count","value":1}.
  {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Inactive"}.

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
class FibaroFgpb101 extends UnknownProduct.with(
  BatteryLevelSupport(0, { minLevel: 0, maxLevel: 100 })) { // Adds battery level support

  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
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
  ],
  configurations: {}
}

export default FibaroFgpb101
