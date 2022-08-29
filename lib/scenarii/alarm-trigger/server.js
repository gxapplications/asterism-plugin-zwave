'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerTrigger } = Scenarii

export default class ServerZwaveAlarmTrigger extends ServerTrigger {
  constructor (data) {
    super(data)
    this.sourceListener = null
    this.deviceStates = {}

    // This is a permanent listener, but will filter on comClass 113 (alarm). Do not rely on this.data that can change...
    ServerZwaveAlarmTrigger.zwaveService.context.zwave.on('value changed', (nodeId, comClass, values) => {
      if (comClass === 113) {
        const type = values.index
        const caseToListen = values.value

        if (this.sourceListener) {
          this.sourceListener(nodeId, type, caseToListen)
        }
      }
    })
  }

  get name () {
    return this.data.name ? `Alarm ${this.data.name}` : `Misconfigured alarm trigger`
  }

  reschedule () {
    this.cancelEvents()
    if (this.listeners.filter((l) => !l.lazy).length === 0) {
      ServerZwaveAlarmTrigger.logger.info(`Trigger ${this.data.name} has no active listener. Trigger unscheduled.`)
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
      this.sourceListener = (nodeId, type, caseToListen) => {
        const event = this.data.events.find((event) =>
          (event.nodeId === nodeId) && (event.type === type) && (event.cases.includes(caseToListen))
        )
        if (!event) {
          return
        }

        // at least one event matching nodeId && type && caseToListen: trigger!
        this.listeners.forEach((listener) => listener())
      }
      return Promise.resolve(true)
    } catch (error) {
      return Promise.reject(error)
    }
  }
}
