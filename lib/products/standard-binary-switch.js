'use strict'

import UnknownProduct from './unknown'
import BinarySwitchSupport from './mixin-binary-switch'

class StandardBinarySwitch extends UnknownProduct.with(BinarySwitchSupport(0)) {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || StandardBinarySwitch.meta.name(this.node.nodeid)
  }
}

StandardBinarySwitch.meta = {
  name: (nodeid) => `Wall plug #${nodeid} (Standard On/Off switch)`,
  manufacturer: 'Unknown',
  product: 'Standard Binary Switch',
  type: 'On/Off Power Switch',
  passive: false,
  battery: false,
  icon: 'power',
  settingPanel: 'standard-binary-switch',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation', 'binarySwitchTurnOn', 'binarySwitchTurnOff',
    'binarySwitchTurnOnOff', 'binarySwitchInvert', 'binarySwitchGetState']
}

export default StandardBinarySwitch
