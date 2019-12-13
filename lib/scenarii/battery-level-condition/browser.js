'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveBatteryLevelConditionEditForm from './edit-form'

const { BrowserCondition } = Scenarii

class BrowserZwaveBatteryLevelCondition extends BrowserCondition {
  get name () {
    return this.data.name ? `Battery ${this.data.name}` : `Misconfigured Z-wave battery level condition`
  }
  get shortLabel () {
    return this.data.name ? `Battery level: ${this.data.name}` : this.name
  }
  get fullLabel () {
    return this.data.name ? `Z-wave battery level matches condition (${this.data.name}).` : this.name
  }

  get EditForm () {
    return ZwaveBatteryLevelConditionEditForm
  }
}

BrowserZwaveBatteryLevelCondition.type = Object.assign({}, BrowserCondition.type, {
  name: 'BrowserZwaveBatteryLevelCondition',
  shortLabel: 'Z-wave battery level',
  fullLabel: 'Conditions Z-wave device battery level matching specific equation',
  icon: 'zwave-on'
})

export default BrowserZwaveBatteryLevelCondition
