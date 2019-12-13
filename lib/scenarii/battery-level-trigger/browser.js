'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveBatteryLevelTriggerEditForm from './edit-form'

const { BrowserTrigger } = Scenarii

class BrowserZwaveBatteryLevelTrigger extends BrowserTrigger {
  get name () {
    const way = (this.data.way === 'decreasing') ? '<' : '>'
    return this.data.name ? `Battery of ${this.data.name} ${way} ${this.data.limit}%` : `Misconfigured battery level trigger`
  }
  get shortLabel () {
    const way = (this.data.way === 'decreasing') ? 'below' : 'above'
    return this.data.name ? `Battery level of ${this.data.name} ${way} ${this.data.limit}%` : this.name
  }
  get fullLabel () {
    const way = (this.data.way === 'decreasing') ? 'downward' : 'upward'
    return this.data.name ? `Z-wave device battery level crossing ${way} the limit of ${this.data.limit}% for ${this.data.name}.` : this.name
  }

  get EditForm () {
    return ZwaveBatteryLevelTriggerEditForm
  }
}

BrowserZwaveBatteryLevelTrigger.type = Object.assign({}, BrowserTrigger.type, {
  name: 'BrowserZwaveBatteryLevelTrigger',
  shortLabel: 'Z-wave battery level',
  fullLabel: 'Triggers when a Z-wave device battery level crosses a limit.',
  icon: 'zwave-on'
})

export default BrowserZwaveBatteryLevelTrigger
