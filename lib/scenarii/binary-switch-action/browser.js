'use strict'

import { Scenarii } from 'asterism-plugin-library'

import ZwaveBinarySwitchActionEditForm from './edit-form'

const { BrowserAction } = Scenarii

class BrowserZwaveBinarySwitchAction extends BrowserAction {
  nodesList () {
    return this.data.nodes.map(({ id, instance }) => instance > 1 ? `${id}(${instance})` : id).join(',')
  }

  get name () {
    const defaultName = `Misconfigured switch control on nodes ${this.nodesList()}`
    switch (this.data.controlMode) {
      case 'invert':
      default:
        return this.data.name ? `Inverts ${this.data.name}` : defaultName
      case 'force-on':
        return this.data.name ? `Turns ON ${this.data.name}` : defaultName
      case 'force-off':
        return this.data.name ? `Turns OFF ${this.data.name}` : defaultName
    }
  }
  get shortLabel () {
    const defaultName = `Misconfigured switch control on nodes ${this.nodesList()}`
    switch (this.data.controlMode) {
      case 'invert':
      default:
        return this.data.name ? `Inverts switch(es) ${this.data.name}` : defaultName
      case 'force-on':
        return this.data.name ? `Turns ON switch(es) ${this.data.name}` : defaultName
      case 'force-off':
        return this.data.name ? `Turns OFF switch(es) ${this.data.name}` : defaultName
    }
  }
  get fullLabel () {
    const defaultName = `Misconfigured switch control on nodes ${this.nodesList()}`
    switch (this.data.controlMode) {
      case 'invert':
      default:
        return this.data.name ? `Inverts Z-wave binary switches states for ${this.data.name}.` : defaultName
      case 'force-on':
        return this.data.name ? `Turns ON Z-wave binary switches states for ${this.data.name}.` : defaultName
      case 'force-off':
        return this.data.name ? `Turns OFF Z-wave binary switches states for ${this.data.name}.` : defaultName
    }
  }

  get EditForm () {
    return ZwaveBinarySwitchActionEditForm
  }
}

BrowserZwaveBinarySwitchAction.type = Object.assign({}, BrowserAction.type, {
  name: 'ZwaveBinarySwitchAction',
  shortLabel: 'Z-wave binary switch control',
  fullLabel: 'A control to manage Z-wave devices binary switches compatible.',
  icon: 'zwave-on'
})

export default BrowserZwaveBinarySwitchAction
