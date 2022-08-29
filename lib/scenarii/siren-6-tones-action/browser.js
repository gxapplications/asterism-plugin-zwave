'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveSiren6TonesActionEditForm from './edit-form'

const { BrowserAction } = Scenarii

class BrowserZwaveSiren6TonesAction extends BrowserAction {
  nodesList () {
    return this.data.nodeIds.join(',')
  }

  get name () {
    const defaultName = `Misconfigured siren control on nodes ${this.nodesList()}`
    return this.data.name ? `Siren ${this.data.name} with ${this.data.tone} at ${this.data.volume}/3` : defaultName
  }
  get shortLabel () {
    const defaultName = `Misconfigured siren control on nodes ${this.nodesList()}`
    return this.data.name ? `Triggers siren(s) ${this.data.name} with tone '${this.data.tone}' at vol ${this.data.volume}/3` : defaultName
  }
  get fullLabel () {
    const defaultName = `Misconfigured siren control on nodes ${this.nodesList()}`
    return this.data.name ? `Triggers Z-wave sirens for ${this.data.name} with tone '${this.data.tone}' at volume ${this.data.volume}/3.` : defaultName
  }

  get EditForm () {
    return ZwaveSiren6TonesActionEditForm
  }
}

BrowserZwaveSiren6TonesAction.type = Object.assign({}, BrowserAction.type, {
  name: 'ZwaveSiren6TonesAction',
  shortLabel: 'Z-wave Philio PSE04 siren control',
  fullLabel: 'A control to manage Z-wave Philio PSE04 sound.',
  icon: 'zwave-on'
})

export default BrowserZwaveSiren6TonesAction
