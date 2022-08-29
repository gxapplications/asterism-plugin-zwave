'use strict'

// Class ID 91 = 0x5B COMMAND_CLASS_CENTRAL_SCENE
// configurations: an object indexed by cmdClass indexes that need to emit an event. as indexed value, a filter
// to transform cmdClass value into another value to emit, or null to avoid emitting the event.
const CentralSceneSupport = (configurations) => (superClass) => class extends superClass {
  constructor (node, context) {
    super(node, context)
    this.node = node
    // this.zwave = context.zwave
    this.logger = context.logger
    this.privateSocketIo = context.privateSocketIo
  }

  centralSceneGetLabel (index, value) {
    const filter = configurations[index]
    if (!filter) {
      return undefined
    }
    return filter(value)
  }

  classValueChanged (comClass, value) {
    switch (comClass) {
      case 91: // 0x5B
        const filter = configurations[value.index]
        if (filter !== undefined) {
          const filtered = filter(value.value)
          if (filtered !== null) {
            try {
              this.logger.info(`Node #${this.node.nodeid} central scene triggered: ${value.index} -> {${filtered.toString()}}.`)
            } catch (err) {
              this.logger.info(`Node #${this.node.nodeid} central scene triggered: #${value.index}: ${value.value}.`)
            }

            if (this._centralSceneTriggered) {
              this._centralSceneTriggered(this.node, filtered)
            }
            this.privateSocketIo.emit('node-event-central-scene-triggered', this.node.nodeid, filtered)
          }
        }
        break
      default:
    }

    if (super.classValueChanged) {
      super.classValueChanged(comClass, value)
    }
  }
}

export default CentralSceneSupport
