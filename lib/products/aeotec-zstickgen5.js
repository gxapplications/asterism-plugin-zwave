'use strict'

import UnknownProduct from './unknown'

class AeotecZStickGen5 extends UnknownProduct {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave

    /*this.zwave.softReset(); console.log('##### SOFT RESET');
    this.zwave.hardReset(); console.log('##### HARD RESET');*/
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || AeotecZStickGen5.meta.name(this.node.nodeid)
  }
}

AeotecZStickGen5.meta = {
  name: (nodeid) => `USB controller #${nodeid} (Aeotec Z-Stick Gen5)`,
  manufacturer: 'Aeotec',
  manufacturerid: '0x0086',
  product: 'Z-Stick Gen5',
  producttype: '0x0001',
  productid: '0x005a',
  type: 'Static PC Controller',
  battery: false,
  icon: 'AeotecZStickGen5',
  settingPanel: false
}

export default AeotecZStickGen5
