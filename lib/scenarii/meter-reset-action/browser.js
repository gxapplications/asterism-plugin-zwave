'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveMeterResetActionEditForm from './edit-form'

const { BrowserAction } = Scenarii

class BrowserZwaveMeterResetAction extends BrowserAction {
  get name () {
    return this.data.name ? `Meter reset ${this.data.name}` : `Misconfigured meter reset on nodes ${this.data.nodeIds.join(', ')}`
  }
  get shortLabel () {
    return this.data.name ? `Meter reset for ${this.data.name}` : this.name
  }
  get fullLabel () {
    return this.data.name ? `Resets meters of Z-wave devices to their initial values for ${this.data.name}.` : this.name
  }

  get EditForm () {
    return ZwaveMeterResetActionEditForm
  }
}

BrowserZwaveMeterResetAction.type = Object.assign({}, BrowserAction.type, {
  name: 'ZwaveMeterResetAction',
  shortLabel: 'Z-wave meter reset control',
  fullLabel: 'A control to reset meters of Z-wave devices meter compatible.',
  icon: 'zwave-on'
})

export default BrowserZwaveMeterResetAction
