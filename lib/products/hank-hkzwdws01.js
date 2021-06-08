'use strict'

import UnknownProduct from './unknown'
import BatteryLevelSupport from './mixin-battery-level'

// Doc found:
// https://products.z-wavealliance.org/products/2844

/* Frames for retro-engineering
  TODO
 */

class HankHkzwdws01 extends UnknownProduct.with(BatteryLevelSupport(0, { minLevel: 0, maxLevel: 100 })) {

  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.scenariiService = context.scenariiService
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || HankHkzwdws01.meta.name(this.node.nodeid)
  }
}

HankHkzwdws01.meta = {
  name: (nodeid) => `Door/Window sensor #${nodeid} (Hank)`,
  manufacturer: 'Hank',
  manufacturerid: '0x0208',
  product: 'HKZW-DWS01',
  producttype: '0x0200',
  productid: '0x0008',
  type: 'Sensor',
  passive: true,
  battery: true,
  icon: 'HankHkzwdws01',
  settingPanel: 'hank-hkzwdws01',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation', 'batteryLevelGetPercent', 'batteryLevelGetIcon'],
  configurations: { }
}

export default HankHkzwdws01
