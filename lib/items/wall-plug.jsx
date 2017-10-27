'use strict'

import cx from 'classnames'
import React from 'react'
import { Button, Icon } from 'react-materialize'
import uuid from 'uuid'

import { Item } from 'asterism-plugin-library'

class WallPlugItem extends Item {
  constructor (props) {
    super(props)
    this.socket = props.context.privateSocket // TODO !0: needed for event listeners ?
    this.zwaveService = props.context.services['asterism-plugin-zwave']

    console.log('####', this.zwaveService, this.props.initialParams)
  }

  /*receiveNewParams (params) {
    // TODO !0: needed ?
    this.setState({ params })
  }*/

  render () {
    const { params } = this.state
    const { mainState, theme } = this.props.context
    const { animationLevel } = mainState()

    console.log('###', params)

    return (
      <Button waves={animationLevel >= 2 ? 'light' : null}
        className={cx(theme.actions.secondary, 'truncate fluid')} onClick={this.click.bind(this)}
      >
        {params.title}
        // TODO !0: icon, title, and a light [OFF/ON] well visible.
        // TODO !0: if compatible, energy (W) instant value + energy evolution (graph) + comsumption counter
      </Button>
    )
  }

  click () {
    // TODO !0
  }
}

export default WallPlugItem
