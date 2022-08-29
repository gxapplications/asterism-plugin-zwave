'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveTemperatureConditionEditForm from './edit-form'

const { BrowserCondition } = Scenarii

class BrowserZwaveTemperatureCondition extends BrowserCondition {
  get name () {
    return this.data.name ? `Temperature ${this.data.name}` : `Misconfigured Z-wave Temperature condition`
  }
  get shortLabel () {
    return this.data.name ? `Temperature: ${this.data.name}` : this.name
  }
  get fullLabel () {
    return this.data.name ? `Z-wave Temperature meter matches condition (${this.data.name}).` : this.name
  }

  get EditForm () {
    return ZwaveTemperatureConditionEditForm
  }
}

BrowserZwaveTemperatureCondition.type = Object.assign({}, BrowserCondition.type, {
  name: 'BrowserZwaveTemperatureCondition',
  shortLabel: 'Z-wave Temperature',
  fullLabel: 'Conditions Z-wave device\'s measured temperature',
  icon: 'zwave-on'
})

export default BrowserZwaveTemperatureCondition
