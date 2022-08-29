'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveRgbwActionEditForm from './edit-form'

const { BrowserAction } = Scenarii

class BrowserZwaveRgbwAction extends BrowserAction {
  get name () {
    const defaultName = `Misconfigured RGBW control on nodes ${this.data.nodeIds.join(',')}`
    switch (this.data.controlMode) {
      case 'colors':
      default:
        const color = this.data.values.slice(0, 4).map(v => `${Math.ceil(v * 2.56).toString(16)}`.padStart(2, '0')).join('')
        return this.data.name ? `Set ${this.data.name} to #${color}` : defaultName
      case 'brightness':
        const brightness = this.data.values[4]
        return this.data.name ? `Set brightness of ${this.data.name} to ${brightness}%` : defaultName
      case 'off':
        return this.data.name ? `Turn OFF ${this.data.name}` : defaultName
    }
  }
  get shortLabel () {
    const defaultName = `Misconfigured RGBW control on nodes ${this.data.nodeIds.join(',')}`
    switch (this.data.controlMode) {
      case 'colors':
      default:
        const color = this.data.values.slice(0, 4).map(v => `${Math.ceil(v * 2.56).toString(16)}`.padStart(2, '0')).join('')
        return this.data.name ? `Set color of switch(es) ${this.data.name} to #${color}` : defaultName
      case 'brightness':
        const brightness = this.data.values[4]
        return this.data.name ? `Set brightness of switch(es) ${this.data.name} to ${brightness}%` : defaultName
      case 'off':
        return this.data.name ? `Turn OFF all switch(es) ${this.data.name}` : defaultName
    }
  }
  get fullLabel () {
    const defaultName = `Misconfigured RGBW control on nodes ${this.data.nodeIds.join(',')}`
    switch (this.data.controlMode) {
      case 'colors':
      default:
        const color = this.data.values.slice(0, 4).map(v => `${Math.ceil(v * 2.56).toString(16)}`.padStart(2, '0')).join('')
        return this.data.name ? `Set 4 channels colors RGBW of switch(es) ${this.data.name} to #${color}` : defaultName
      case 'brightness':
        const brightness = this.data.values[4]
        return this.data.name ? `Set main brightness of switch(es) ${this.data.name} to ${brightness}%` : defaultName
      case 'off':
        return this.data.name ? `Turn OFF all switch(es) ${this.data.name}` : defaultName
    }
  }

  get EditForm () {
    return ZwaveRgbwActionEditForm
  }
}

BrowserZwaveRgbwAction.type = Object.assign({}, BrowserAction.type, {
  name: 'ZwaveRgbwAction',
  shortLabel: 'Z-wave RGBW control',
  fullLabel: 'A control to manage Z-wave devices with multi-level switches in multiple channels (up to 5).',
  icon: 'zwave-on'
})

export default BrowserZwaveRgbwAction
