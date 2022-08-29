'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveAlarmConditionEditForm from './edit-form'

const { BrowserCondition } = Scenarii

class BrowserZwaveAlarmCondition extends BrowserCondition {
  get name () {
    return this.data.name ? `Alarm ${this.data.name}` : `Misconfigured Z-wave alarm status condition`
  }
  get shortLabel () {
    return this.data.name ? `Alarm status: ${this.data.name}` : this.name
  }
  get fullLabel () {
    return this.data.name ? `Z-wave Alarm status matches condition (${this.data.name}).` : this.name
  }

  get EditForm () {
    return ZwaveAlarmConditionEditForm
  }
}

BrowserZwaveAlarmCondition.type = Object.assign({}, BrowserCondition.type, {
  name: 'BrowserZwaveAlarmCondition',
  shortLabel: 'Z-wave alarm status',
  fullLabel: 'Conditions Z-wave device\'s alarm status',
  icon: 'zwave-on'
})

export default BrowserZwaveAlarmCondition
