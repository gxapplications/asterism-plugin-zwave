'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveCentralSceneTriggerEditForm from './edit-form'

const { BrowserTrigger } = Scenarii

class BrowserZwaveCentralSceneTrigger extends BrowserTrigger {

  get name () {
    return this.data.name ? `Central scene ${this.data.name}` : 'Misconfigured z-wave central scene trigger'
  }
  get shortLabel () {
    return this.data.name ? `Central scene event ${this.data.name}` : 'Misconfigured z-wave central scene trigger'
  }
  get fullLabel () {
    return this.data.name ? `Z-wave central scene event occured: ${this.data.name}.` : 'Misconfigured z-wave central scene trigger'
  }

  get EditForm () {
    return ZwaveCentralSceneTriggerEditForm
  }
}

BrowserZwaveCentralSceneTrigger.type = Object.assign({}, BrowserTrigger.type, {
  name: 'BrowserZwaveCentralSceneTrigger',
  shortLabel: 'Z-wave central scene',
  fullLabel: 'Triggers when a Z-wave specific \'Central Scene event\' occurs (for compatible devices).',
  icon: 'zwave-on'
})

export default BrowserZwaveCentralSceneTrigger
