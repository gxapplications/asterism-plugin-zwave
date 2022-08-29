'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveInstantEnergyConditionEditForm from './edit-form'

const { BrowserCondition } = Scenarii

class BrowserZwaveInstantEnergyCondition extends BrowserCondition {
  get name () {
    return this.data.name ? `Power ${this.data.name}` : `Misconfigured Z-wave Instant energy condition`
  }
  get shortLabel () {
    return this.data.name ? `Instant energy: ${this.data.name}` : this.name
  }
  get fullLabel () {
    return this.data.name ? `Z-wave Instant energy meter matches condition (${this.data.name}).` : this.name
  }

  get EditForm () {
    return ZwaveInstantEnergyConditionEditForm
  }
}

BrowserZwaveInstantEnergyCondition.type = Object.assign({}, BrowserCondition.type, {
  name: 'BrowserZwaveInstantEnergyCondition',
  shortLabel: 'Z-wave Instant energy',
  fullLabel: 'Conditions Z-wave device\'s instant energy meter level',
  icon: 'zwave-on'
})

export default BrowserZwaveInstantEnergyCondition
