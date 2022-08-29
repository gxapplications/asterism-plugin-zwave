'use strict'

const NameLocationFromDataSupport = () => (superClass) => class extends superClass {
  constructor (node, context) {
    super(node, context)
    this.node = node
    this.context = context
    this.dataHandler = context.dataHandler
    this.logger = context.logger

    this.dataNameLocation = { name: null, location: null }
    this.dataNameKey = `zwave-node-${this.node.nodeid}-name-location`
    this.dataHandler.getItem(this.dataNameKey)
      .then((data) => {
        this.dataNameLocation = data || { name: null, location: null }
      })
  }

  setLocation (location) {
    this.context.zwave.setNodeLocation(this.node.nodeid, location) // allows temporary persistence
    this.dataNameLocation.location = location
    this.dataHandler.setItem(this.dataNameKey, this.dataNameLocation)
  }

  getLocation () {
    return this.dataNameLocation.location || null
  }

  setName (name) {
    this.context.zwave.setNodeName(this.node.nodeid, name) // allows temporary persistence
    this.dataNameLocation.name = name
    this.dataHandler.setItem(this.dataNameKey, this.dataNameLocation)
  }

  getName () {
    if (this.dataNameLocation.name) {
      return this.dataNameLocation.name
    }
    return null
  }
}

export default NameLocationFromDataSupport
