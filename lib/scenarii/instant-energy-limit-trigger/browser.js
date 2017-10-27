'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveInstantEnergyLimitTriggerEditForm from './edit-form'

const { BrowserTrigger } = Scenarii

class BrowserZwaveInstantEnergyLimitTrigger extends BrowserTrigger {
  get name () {
    const way = (this.data.way === 'decreasing') ? '<' : '>'
    return this.data.name ? `Power of ${this.data.name} ${way} ${this.data.limit}W` : `Misconfigured power limit trigger on node #${this.data.nodeId}`
  }
  get shortLabel () {
    const way = (this.data.way === 'decreasing') ? 'below' : 'above'
    return this.data.name ? `Power limit of ${this.data.name} ${way} ${this.data.limit}W` : this.name
  }
  get fullLabel () {
    const way = (this.data.way === 'decreasing') ? 'downward' : 'upward'
    return this.data.name ? `Z-wave device measured power crossing ${way} the limit of ${this.data.limit}W for ${this.data.name}.` : this.name
  }

  get EditForm () {
    return ZwaveInstantEnergyLimitTriggerEditForm
  }
}

BrowserZwaveInstantEnergyLimitTrigger.type = Object.assign({}, BrowserTrigger.type, {
  name: 'BrowserZwaveInstantEnergyLimitTrigger',
  shortLabel: 'Z-wave power limit',
  fullLabel: 'Triggers when a Z-wave device measured power crosses a limit.'
})

export default BrowserZwaveInstantEnergyLimitTrigger
