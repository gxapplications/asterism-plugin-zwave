'use strict'

// XXX !help: https://github.com/OpenZWave/node-openzwave-shared/blob/master/README-api.md
// XXX !help: https://github.com/OpenZWave/node-openzwave-shared/blob/master/types/openzwave-shared.d.ts#L103
class UnknownProduct {
  constructor (node, context) {
    this.node = node
    this.context = context
  }

  static with (...mixins) {
    return mixins.reduce((c, mixin) => mixin(c), UnknownProduct)
  }

  // classValueChanged (comClass, value) {}
  // classValueRemoved (comClass, index) {}
  // notification (notificationIndex) {}
  // beforeDestroy ()
  // nodeEvent (data) {}

  setLocation (location) {
    this.context.zwave.setNodeLocation(this.node.nodeid, location)
    this.context.zwaveService.persistConfiguration()
  }

  getLocation () {
    return this.context.zwave.getNodeLocation(this.node.nodeid)
  }

  setName (name) {
    this.context.zwave.setNodeName(this.node.nodeid, name)
    this.context.zwaveService.persistConfiguration()
  }

  getName () {
    return this.context.zwave.getNodeName(this.node.nodeid) || `${this.constructor.meta.product} (${this.constructor.meta.type } from ${this.constructor.meta.manufacturer})`
  }

  requestConfigurations (...indexes) {
    indexes.forEach((i) => {
      this.context.zwave.requestConfigParam(this.node.nodeid, i)
    })
  }

  getConfiguration (index, instance = 1) {
    if (!this.node.classes[112] || !this.node.classes[112][index] || !this.node.classes[112][index][instance]) {
      return undefined
    }
    return this.node.classes[112][index][instance].value
  }

  setConfiguration (index, value) {
    this.context.zwave.setConfigParam(this.node.nodeid, index, value)
    this.context.privateSocketIo.emit('node-event-configuration-updated', this.node.nodeid, index, value)
    this.context.zwaveService.persistConfiguration()
  }
}

UnknownProduct.meta = {
  name: (nodeid) => `Unknown product #${nodeid}`,
  manufacturer: 'Unknown',
  product: 'Unknown',
  type: 'Unknown',
  settingPanel: 'unknown',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation'],
  configurations: {}
}

UnknownProduct.notifications = {
  'message_complete': 0,
  'timeout': 1,
  'nop': 2,
  'awake': 3,
  'sleep': 4,
  'dead': 5,
  'alive': 6,
  '_list': ['message_complete', 'timeout', 'nop', 'awake', 'sleep', 'dead', 'alive']
}

export default UnknownProduct
