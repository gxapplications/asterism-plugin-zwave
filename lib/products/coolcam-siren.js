'use strict'

import UnknownProduct from './unknown'

/*
 https://products.z-wavealliance.org/products/3069?selectedFrequencyId=1

 A étudier pour supporter : COMMAND_CLASS_BATTERY, COMMAND_CLASS_CONFIGURATION,
 COMMAND_CLASS_INDICATOR ? COMMAND_CLASS_POWERLEVEL ? COMMAND_CLASS_SWITCH_BINARY !!!
 Configs:
 - Alarm Sound Volume,
 - Alarm Sound Duration Time
 - Door Bell Sound Duration Time,
 - Door Bell Sound Volume,
 - Alarm Sound Index,
 - Door Bell Sound Index,
 - Default Siren On Mode ?
 - Alarm Led Enable,
 - Door Bell Led Enable
 */
class CoolcamSiren extends UnknownProduct {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || CoolcamSiren.meta.name(this.node.nodeid)
  }
}

CoolcamSiren.meta = {
  name: (nodeid) => `Alarm Siren #${nodeid} (NeoCoolcam Siren)`,
  manufacturer: 'Coolcam',
  manufacturerid: '0x0258',
  product: 'NAS-AB02ZE',
  producttype: '0x0200',
  productid: '0x1028',
  type: 'Siren',
  passive: false, // TODO !2: true ? works with a battery
  battery: true,
  icon: 'CoolcamSiren',
  settingPanel: false, // TODO !2: to true, and manage it
  settingPanelProvidedFunctions: [],
  configurations: {}
}

export default CoolcamSiren
