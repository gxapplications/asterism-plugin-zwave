'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveBinarySwitchStateTriggerEditForm from './edit-form'

const { BrowserTrigger } = Scenarii

class BrowserZwaveBinarySwitchStateTrigger extends BrowserTrigger {
  nodesList () {
    return this.data.nodes.map(({ id, instance }) => instance > 1 ? `${id}(${instance})` : id).join(',')
  }

  get name () {
    const defaultName = `Misconfigured switch state trigger on nodes ${this.nodesList()}`
    switch (this.data.event) {
      case 'inverted':
      default:
        return this.data.name ? `Switch ${this.data.name} inverted` : defaultName
      case 'turned-on':
        return this.data.name ? `Switch ${this.data.name} turned ON` : defaultName
      case 'turned-off':
        return this.data.name ? `Switch ${this.data.name} turned OFF` : defaultName
    }
  }
  get shortLabel () {
    const defaultName = `Misconfigured switch state trigger on nodes ${this.nodesList()}`
    switch (this.data.event) {
      case 'inverted':
      default:
        return this.data.name ? `Switch state of ${this.data.name} inverted` : defaultName
      case 'turned-on':
        return this.data.name ? `Switch state of ${this.data.name} turned ON` : defaultName
      case 'turned-off':
        return this.data.name ? `Switch state of ${this.data.name} turned OFF` : defaultName
    }
  }
  get fullLabel () {
    const defaultName = `Misconfigured switch state trigger on nodes ${this.nodesList()}`
    switch (this.data.event) {
      case 'inverted':
      default:
        return this.data.name ? `Z-wave binary switch state changed for ${this.data.name}: inverted.` : defaultName
      case 'turned-on':
        return this.data.name ? `Z-wave binary switch state changed for ${this.data.name}: turned ON.` : defaultName
      case 'turned-off':
        return this.data.name ? `Z-wave binary switch state changed for ${this.data.name}: turned OFF.` : defaultName
    }
  }

  get EditForm () {
    return ZwaveBinarySwitchStateTriggerEditForm
  }
}

BrowserZwaveBinarySwitchStateTrigger.type = Object.assign({}, BrowserTrigger.type, {
  name: 'BrowserZwaveBinarySwitchStateTrigger',
  shortLabel: 'Z-wave binary switch state',
  fullLabel: 'Triggers when a Z-wave binary switch device state changes.',
  icon: 'zwave-on'
})

export default BrowserZwaveBinarySwitchStateTrigger
