'use strict'

import UnknownProduct from './unknown'

// Doc found:
// https://products.z-wavealliance.org/products/3006

/*
 * TODO : retro engineering
 */

class HeimanHs1saz extends UnknownProduct {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || HeimanHs1saz.meta.name(this.node.nodeid)
  }
}

HeimanHs1saz.meta = {
  name: (nodeid) => `Smoke sensor #${nodeid} (Heiman)`,
  manufacturer: 'Heiman',
  manufacturerid: '0x0260',
  product: 'HS1SA-Z',
  producttype: '0x8002',
  productid: '0x1000',
  type: 'Sensor',
  passive: true,
  battery: true,
  icon: 'HeimanHs1saz',
  settingPanel: false
}

export default HeimanHs1saz
