'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveEnergyConsumptionConditionEditForm from './edit-form'

const { BrowserCondition } = Scenarii

class BrowserZwaveEnergyConsumptionCondition extends BrowserCondition {
  get name () {
    return this.data.name ? `Consumption ${this.data.name}` : `Misconfigured Z-wave Energy consumption condition`
  }
  get shortLabel () {
    return this.data.name ? `Energy consumption: ${this.data.name}` : this.name
  }
  get fullLabel () {
    return this.data.name ? `Z-wave Energy consumption meter matches condition (${this.data.name}).` : this.name
  }

  get EditForm () {
    return ZwaveEnergyConsumptionConditionEditForm
  }
}

BrowserZwaveEnergyConsumptionCondition.type = Object.assign({}, BrowserCondition.type, {
  name: 'BrowserZwaveEnergyConsumptionCondition',
  shortLabel: 'Z-wave Energy consumption',
  fullLabel: 'Conditions Z-wave device\'s energy consumption meter state',
  icon: 'zwave-on'
})

export default BrowserZwaveEnergyConsumptionCondition
