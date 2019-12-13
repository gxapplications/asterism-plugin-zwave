'use strict'

import { Scenarii } from 'asterism-plugin-library'

const { ServerAction } = Scenarii

export default class ServerZwaveRgbwAction extends ServerAction {
  get name () {
    const defaultName = `Misconfigured RGBW control on nodes ${this.data.nodeIds.join(',')}`
    switch (this.data.controlMode) {
      case 'colors':
      default:
        const color = this.data.values.slice(0, 4).map(v => Math.abs(v).toString(16)).join('')
        return this.data.name ? `Set ${this.data.name} to #${color}` : defaultName
      case 'brightness':
        const brightness = this.data.values[4]
        return this.data.name ? `Set brightness of ${this.data.name} to ${brightness}%` : defaultName
      case 'off':
        return this.data.name ? `Turn OFF ${this.data.name}` : defaultName
    }
  }

  execute (executionId) {
    const nodes = this.data.nodeIds.map((id) => ServerZwaveRgbwAction.zwaveService.getNodeById(id)).filter((node, index) => {
      if (!node) {
        ServerZwaveRgbwAction.logger.warning(`RGBW switch action failed: node "${this.data.nodeIds[index]} not ready.`)
        return false
      }
      if (!node.setRGBWColorsPercent || !node.setRGBWBrightnessPercent) {
        ServerZwaveRgbwAction.logger.error(`RGBW switch action failed: node "${this.data.nodeIds[index]} not compatible with the action.`)
        return false
      }
      return true
    })
    if (nodes.length === 0) {
      return Promise.reject(false)
    }

    return new Promise((resolve, reject) => {
      nodes.forEach((node) => {
        switch (this.data.controlMode) {
          case 'colors':
          default:
            const colors = this.data.values
            node.setRGBWColorsPercent(colors[0], colors[1], colors[2], colors[3])
            break
          case 'brightness':
            node.setRGBWBrightnessPercent(this.data.values[4])
            break
          case 'off':
            node.setRGBWBrightnessPercent(0)
        }
      })
      resolve(true)
    })
  }
}
