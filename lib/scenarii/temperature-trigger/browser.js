'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveTemperatureTriggerEditForm from './edit-form'

const { BrowserTrigger } = Scenarii

class BrowserZwaveTemperatureTrigger extends BrowserTrigger {
  get name () {
    const way = (this.data.way === 'decreasing') ? '<' : '>'
    return this.data.name ? `Temperature of ${this.data.name} ${way} ${this.data.limit}°C` : `Misconfigured temperature trigger on node #${this.data.nodeId}`
  }
  get shortLabel () {
    const way = (this.data.way === 'decreasing') ? 'below' : 'above'
    return this.data.name ? `Temperature of ${this.data.name} ${way} ${this.data.limit}°C` : this.name
  }
  get fullLabel () {
    const way = (this.data.way === 'decreasing') ? 'downward' : 'upward'
    return this.data.name ? `Z-wave temperature crossing ${way} the limit of ${this.data.limit}°C for ${this.data.name}.` : this.name
  }

  get EditForm () {
    return ZwaveTemperatureTriggerEditForm
  }
}

BrowserZwaveTemperatureTrigger.type = Object.assign({}, BrowserTrigger.type, {
  name: 'BrowserZwaveTemperatureTrigger',
  shortLabel: 'Z-wave temperature',
  fullLabel: 'Triggers when a Z-wave device measured temperature crosses a limit.',
  icon: 'zwave-on'
})

export default BrowserZwaveTemperatureTrigger
