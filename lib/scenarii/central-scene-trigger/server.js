'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerTrigger } = Scenarii

export default class ServerZwaveCentralSceneTrigger extends ServerTrigger {
  constructor (data) {
    super(data)
    this.sourceListener = null

    // This is a permanent listener, but will filter on comClass 37 (binary switch control). Do not rely on this.data that can change...
    ServerZwaveCentralSceneTrigger.zwaveService.context.zwave.on('value changed', (nodeId, comClass, values) => {
      if (comClass === 91) {
        if (this.sourceListener) {
          const node = ServerZwaveCentralSceneTrigger.zwaveService.getNodeById(parseInt(nodeId, 10))
          if (node === undefined || node === null) {
            return
          }

          const centralSceneMapper = node.constructor.meta && node.constructor.meta.centralSceneMapper
          if (centralSceneMapper === undefined || centralSceneMapper === null) {
            return
          }

          const centralSceneValue = centralSceneMapper[`${values.index}`] && centralSceneMapper[`${values.index}`](values.value)
          if (centralSceneValue === null) {
            return
          }

          this.sourceListener(nodeId, centralSceneValue)
        }
      }
    })
  }

  get name () {
    return this.data.name ? `Central scene ${this.data.name}` : 'Misconfigured z-wave central scene trigger'
  }

  reschedule () {
    this.cancelEvents()
    if (this.listeners.filter((l) => !l.lazy).length === 0) {
      ServerZwaveCentralSceneTrigger.logger.info(`Trigger ${this.data.name} has no active listener. Trigger unscheduled.`)
      // there is no mandatory listeners (lazy are called only if there is 'no lazy listeners' registered). So do no schedule.
      return Promise.resolve(true)
    }
    return this.scheduleEvents()
  }


  cancelEvents () {
    if (this.sourceListener) {
      delete this.sourceListener
    }
  }

  scheduleEvents () {
    try {
      this.sourceListener = (nodeId, centralSceneValue) => {
        if (this.data.nodes.filter(
          (n) => n.nodeId === nodeId && JSON.stringify(n.centralSceneValue) === JSON.stringify(centralSceneValue)
        ).length > 0) {
          this.listeners.forEach((listener) => listener())
        }
      }
      return Promise.resolve(true)
    } catch (error) {
      return Promise.reject(error)
    }
  }
}
