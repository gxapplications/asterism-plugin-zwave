'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveBinarySwitchActionEditForm from './edit-form'

const { BrowserAction } = Scenarii

class BrowserZwaveBinarySwitchAction extends BrowserAction {
  get name () {
    return this.data.name ? `Switch: ${this.data.name}` : `Misconfigured switch control on node #${this.data.nodeId}`
  }
  get shortLabel () {
    return this.data.name ? `Switches node #${this.data.nodeId}: ${this.data.name}` : this.name
  }
  get fullLabel () {
    return this.data.name ? `Switches Z-wave binary switch state for node #${this.data.nodeId}: ${this.data.name}` : this.name
  }

  get EditForm () {
    return ZwaveBinarySwitchActionEditForm
  }
}

BrowserZwaveBinarySwitchAction.type = Object.assign({}, BrowserAction.type, {
  name: 'ZwaveBinarySwitchAction',
  shortLabel: 'Z-wave binary switch control',
  fullLabel: 'A control to manage a Z-wave device binary switch compatible'
})

export default BrowserZwaveBinarySwitchAction
