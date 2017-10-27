'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveDeadNodeTriggerEditForm from './edit-form'

const { BrowserTrigger } = Scenarii

class BrowserZwaveDeadNodeTrigger extends BrowserTrigger {
  get name () {
    return this.data.name ? `${this.data.name} just dead` : `Misconfigured dead node trigger on node #${this.data.nodeId}`
  }
  get shortLabel () {
    return this.data.name ? `Node(s) ${this.data.name} just dead` : this.name
  }
  get fullLabel () {
    return this.data.name ? `Z-wave device is marked dead by controller (not responding) for ${this.data.name}.` : this.name
  }

  get EditForm () {
    return ZwaveDeadNodeTriggerEditForm
  }
}

BrowserZwaveDeadNodeTrigger.type = Object.assign({}, BrowserTrigger.type, {
  name: 'BrowserZwaveDeadNodeTrigger',
  shortLabel: 'Z-wave dead node',
  fullLabel: 'Triggers when a Z-wave device is marked as dead by controller (not responding).'
})

export default BrowserZwaveDeadNodeTrigger
