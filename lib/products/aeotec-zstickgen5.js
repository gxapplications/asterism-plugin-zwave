'use strict'

import UnknownProduct from './unknown'

class AeotecZStickGen5 extends UnknownProduct {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger

    /*this.zwave.softReset(); console.log('##### SOFT RESET');
    this.zwave.hardReset(); console.log('##### HARD RESET');*/
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || AeotecZStickGen5.meta.name(this.node.nodeid)
  }

  addMode () {
    return this.zwave.addNode(false)
  }

  addSecureMode () {
    return this.zwave.addNode(true)
  }

  removeMode () {
    return this.zwave.removeNode()
  }

  test () {
    this.logger.log('test feature triggered')
    //return this.zwave.removeFailedNode(10)
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
  settingPanel: 'aeotec-zstickgen5',
  settingPanelProvidedFunctions: [
    'getName', 'getLocation', 'setName', 'setLocation', 'getConfiguration', 'setConfiguration',
    'addMode', 'addSecureMode', 'removeMode', 'test'
  ]
}

export default AeotecZStickGen5
