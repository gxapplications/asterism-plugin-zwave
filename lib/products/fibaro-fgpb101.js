'use strict'

import UnknownProduct from './unknown'

/*
  https://products.z-wavealliance.org/products/1944?selectedFrequencyId=1

 */
class FibaroFgpb101 extends UnknownProduct {
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
  passive: true, // TODO !2: check if really true
  battery: true,
  icon: 'FibaroFgpb101',
  settingPanel: false, // TODO !2: to true, and manage it
  settingPanelProvidedFunctions: [],
  configurations: {}
}

export default FibaroFgpb101
