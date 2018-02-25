'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerCondition } = Scenarii

export default class ServerZwaveAlarmCondition extends ServerCondition {
  get name () {
    return this.data.name ? `Alarm ${this.data.name}` : `Misconfigured Z-wave alarm status condition`
  }

  test () {
    return Promise.all(this.data.events.map(event => {
      const node = ServerZwaveAlarmCondition.zwaveService.getNodeById(event.nodeId)
      if (!node) {
        throw new Error(`Node #${nodeId} cannot be retrieved.`)
      }
      let lastState = node.alarmGetLastLabel(event.type)
      lastState = (lastState === undefined) ? null : lastState // special 'unknown' case using null value
      return lastState === event.state
    }))
    .then((results) => {
      switch (this.data.aggregation) {
        case 'any':
        default:
          return results.includes(true) // at least one is true (logical OR)
        case 'every':
          return !results.includes(false) // each of them (logical AND)
      }
    })
  }
}
