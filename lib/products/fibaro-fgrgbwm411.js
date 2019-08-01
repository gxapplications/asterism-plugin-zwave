'use strict'

import UnknownProduct from './unknown'

/*
  // https://products.z-wavealliance.org/products/1054
      cmd classes to implement:
        Command Class Configuration
        Command Class Meter
        Command Class Multi-Channel V1 ???
        Command Class Sensor Multilevel
        Command Class Switch All
        Command Class Switch Multilevel
 */

class FibaroFgrgbwm441 extends UnknownProduct.with() {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.dataHandler = context.dataHandler
    this.privateSocketIo = context.privateSocketIo
    this.scenariiService = context.scenariiService

    const c = FibaroFgrgbwm441.meta.configurations
    this.requestConfigurations(
      // TODO !0
    )
  }

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || FibaroFgrgbwm441.meta.name(this.node.nodeid)
  }
}

FibaroFgrgbwm441.meta = {
  name: (nodeid) => `RGBW controller #${nodeid} (FIBARO RGBW Controller)`,
  manufacturer: 'FIBARO System',
  manufacturerid: '0x010f',
  product: 'FGRGBWM-441',
  producttype: '0x0900',
  productid: '0x1000',
  type: 'RGBW controller',
  passive: false,
  battery: false,
  icon: 'FibaroFgrgbwm441',
  settingPanel: false, // TODO !0: 'fibaro-fgrgbwm441',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation',
    'getConfiguration', 'setConfiguration'],
  configurations: {

  }
}

export default FibaroFgrgbwm441
