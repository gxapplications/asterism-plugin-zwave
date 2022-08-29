'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveAlarmTriggerEditForm from './edit-form'

const { BrowserTrigger } = Scenarii

class BrowserZwaveAlarmTrigger extends BrowserTrigger {
  get name () {
    return this.data.name ? `Alarm ${this.data.name}` : `Misconfigured alarm trigger`
  }
  get shortLabel () {
    return this.data.name ? `Alarm for ${this.data.name}` : this.name
  }
  get fullLabel () {
    return this.data.name ? `Z-wave alarm event raised by ${this.data.name}.` : this.name
  }

  get EditForm () {
    return ZwaveAlarmTriggerEditForm
  }
}

BrowserZwaveAlarmTrigger.type = Object.assign({}, BrowserTrigger.type, {
  name: 'BrowserZwaveAlarmTrigger',
  shortLabel: 'Z-wave alarm',
  fullLabel: 'Triggers when one of the linked Z-wave devices raises an alarm event',
  icon: 'zwave-on'
})

export default BrowserZwaveAlarmTrigger
