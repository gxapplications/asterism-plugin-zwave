'use strict'

import cx from 'classnames'
import React from 'react'
import { Button, TextInput, Preloader, Row } from 'react-materialize'

import { ItemSettingPanel } from 'asterism-plugin-library'

import PilotWireItem from './pilot-wire'

class PilotWireItemSettingPanel extends ItemSettingPanel {
  constructor (props) {
    super(props)

    this.zwaveService = props.context.services['asterism-plugin-zwave']
    this.state.compatibleNodes = []
    this.state.panelReady = false
    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this.zwaveService.getNodesByProvidedFunctions(['multiLevelSwitchGetPercent'])
    .then((nodes) => {
      if (this._mounted) {
        this.setState({
          compatibleNodes: nodes.length ? nodes : [{ nodeid: 0, name: 'No compatible device available' }],
          panelReady: true
        })
        if (nodes.length === 1) {
          this.handleValueChange('nodeId', nodes[0].nodeid)
        }
      }
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }

  render () {
    const { theme, mainState } = this.props.context
    const { compatibleNodes, panelReady } = this.state
    const { title = '', nodeId = 0 } = this.state.params
    const { animationLevel } = mainState()

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div className='clearing padded'>
        <Row className='padded card'>
          TODO !0
        </Row>
        <Button waves={waves} className={cx('right btn-bottom-sticky', theme.actions.primary)} onClick={this.save.bind(this)}>
          Save &amp; close
        </Button>
      </div>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }

  save () {
    this.next(PilotWireItem, this.state.params)
  }
}

export default PilotWireItemSettingPanel
