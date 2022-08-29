'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveBinarySwitchStateConditionEditForm from './edit-form'

const { BrowserCondition } = Scenarii

class BrowserZwaveBinarySwitchStateCondition extends BrowserCondition {
  get name () {
    return this.data.name ? `Switch ${this.data.name}` : `Misconfigured Z-wave Binary switch state condition`
  }
  get shortLabel () {
    return this.data.name ? `Switch state: ${this.data.name}` : this.name
  }
  get fullLabel () {
    return this.data.name ? `Z-wave binary switch state(s) matches condition (${this.data.name}).` : this.name
  }

  get EditForm () {
    return ZwaveBinarySwitchStateConditionEditForm
  }
}

BrowserZwaveBinarySwitchStateCondition.type = Object.assign({}, BrowserCondition.type, {
  name: 'BrowserZwaveBinarySwitchStateCondition',
  shortLabel: 'Z-wave Binary switch state',
  fullLabel: 'Conditions Z-wave device\'s binary switch state',
  icon: 'zwave-on'
})

export default BrowserZwaveBinarySwitchStateCondition
