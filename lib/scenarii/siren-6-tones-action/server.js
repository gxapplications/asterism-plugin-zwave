'use strict'

import { Scenarii } from 'asterism-plugin-library'
import PhilioPse04 from '../../products/philio-pse04'

const { ServerAction } = Scenarii

export default class ServerZwaveSiren6TonesAction extends ServerAction {
  nodesList () {
    return this.data.nodeIds.join(',')
  }

  get name () {
    const defaultName = `Misconfigured siren control on nodes ${this.nodesList()}`
    return this.data.name ? `Siren ${this.data.name} with ${this.data.tone} at ${this.data.volume}/3` : defaultName
  }

  execute (executionId) {
    const nodes = this.data.nodeIds
      .map((id) => ServerZwaveSiren6TonesAction.zwaveService.getNodeById(id))
      .filter((node, index) => {
        if (!node) {
          ServerZwaveSiren6TonesAction.logger.warning(`Siren 6 tones action failed: node #${this.data.nodeIds[index]} not ready.`)
          return false
        }
        if (!node.playTone) {
          ServerZwaveSiren6TonesAction.logger.error(`Siren 6 tones action failed: node #${this.data.nodeIds[index]} not compatible with the action.`)
          return false
        }
        return true
      })
    if (nodes.length === 0) {
      return Promise.reject(false)
    }
    let waitDuration = 30000

    nodes.forEach((node, idx) => {
      // 1 means 30 seconds !
      const soundDuration = node.getConfiguration(PhilioPse04.meta.configurations.SOUND_DURATION) * 30000
      if (soundDuration > waitDuration) {
        waitDuration = soundDuration
      }
      node.play(this.data.tone, this.data.volume)
    })

    if (!this.data.wait) {
      return Promise.resolve(true)
    }

    // wait === true
    const run = new Promise((resolve, reject) => {
      try {
        setTimeout(() => {
          if (!this.executionIds[executionId]) {
            return resolve(false) // abort case
          }
          console.log('Siren delay reached.')
          resolve(true)
        }, waitDuration + 2000) // 2s more :)
      } catch (error) {
        reject(error)
      }
    })

    this.executionIds[executionId] = run
    return run
      .then((result) => {
        delete this.executionIds[executionId]
        return result
      })
      .catch((error) => {
        delete this.executionIds[executionId]
        throw error
      })
  }

  abort (executionId) {
    if (!this.executionIds[executionId]) {
      return Promise.reject(new Error('Siren already stopped.'))
    }

    const nodes = this.data.nodeIds
      .map((id) => ServerZwaveSiren6TonesAction.zwaveService.getNodeById(id))
      .filter((node, index) => {
        if (!node) {
          ServerZwaveSiren6TonesAction.logger.warning(`Siren 6 tones action failed: node #${this.data.nodeIds[index]} not ready.`)
          return false
        }
        if (!node.playTone) {
          ServerZwaveSiren6TonesAction.logger.error(`Siren 6 tones action failed: node #${this.data.nodeIds[index]} not compatible with the action.`)
          return false
        }
        return true
      })
    if (nodes.length === 0) {
      return Promise.resolve(false)
    }

    nodes.forEach((node, idx) => {
      node.playTone(0)
    })
    this.executionIds[executionId] = null
    return Promise.resolve(false)
  }
}
