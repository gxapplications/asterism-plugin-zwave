'use strict'

import cx from 'classnames'
import React from 'react'
import { Button, Input, Row } from 'react-materialize'

import { ItemSettingPanel, IconPicker, ActionColorSwitch } from 'asterism-plugin-library'

import WallPlugItem from './wall-plug'

class WallPlugItemSettingPanel extends ItemSettingPanel {
  constructor (props) {
    super(props)

    this.zwaveService = props.context.services['asterism-plugin-zwave']
    this.state.compatibleNodes = []
    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this.zwaveService.getNodesByProvidedFunctions(['binarySwitchInvert', 'binarySwitchTurnOn',
      'binarySwitchTurnOff', 'binarySwitchGetState'])
    .then((nodes) => {
      if (this._mounted) {
        this.setState({
          compatibleNodes: nodes.length ? nodes : [{ nodeid: 0, name: 'No compatible device available' }],
          ready: true
        })
      }
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }

  componentWillUpdate (nextProps, nextState) {
    // Because of react-materialize bad behaviors...
    if (this.state.params.title !== nextState.params.title) {
      this._title.setState({ value: nextState.params.title })
    }
  }

  render () {
    const { theme, mainState } = this.props.context
    const { title = '' } = this.state.params
    const { animationLevel } = mainState()

    const waves = animationLevel >= 2 ? 'light' : undefined

    // TODO !0: node choice (compatible only), then (if node is compatible with: ) add color ring depending on the energy(W) ; add comsumption table & energy in time
    return (
      <div className='clearing padded'>
        <Row className='padded card'>
          <Input placeholder='Button title' s={12} label='Label' ref={(c) => { this._title = c }}
            value={title} onChange={this.handleEventChange.bind(this, 'title')} />
        </Row>
        <Button waves={waves} className={cx('right', theme.actions.primary)} onClick={this.save.bind(this)}>
          Save &amp; close
        </Button>
      </div>
    )
  }

  save () {
    this.next(WallPlugItem, this.state.params)
  }
}

export default WallPlugItemSettingPanel
