'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveEnergyConsumptionLimitTriggerEditForm from './edit-form'

const { BrowserTrigger } = Scenarii

class BrowserZwaveEnergyConsumptionLimitTrigger extends BrowserTrigger {
  get name () {
    return this.data.name ? `Energy consumption of ${this.data.name}` : `Misconfigured energy consumption limit trigger on node #${this.data.nodeId}`
  }
  get shortLabel () {
    return this.data.name ? `Energy consumption limit: ${this.data.name}` : this.name
  }
  get fullLabel () {
    return this.data.name ? `Z-wave device energy consumption crossing a limit: ${this.data.name}.` : this.name
  }

  get EditForm () {
    return ZwaveEnergyConsumptionLimitTriggerEditForm
  }
}

BrowserZwaveEnergyConsumptionLimitTrigger.type = Object.assign({}, BrowserTrigger.type, {
  name: 'BrowserZwaveEnergyConsumptionLimitTrigger',
  shortLabel: 'Z-wave energy consumption limit',
  fullLabel: 'Triggers when a Z-wave device energy consumption crosses a limit.'
})

export default BrowserZwaveEnergyConsumptionLimitTrigger
