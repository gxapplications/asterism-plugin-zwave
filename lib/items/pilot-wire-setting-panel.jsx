'use strict'

import cx from 'classnames'
import React from 'react'
import { Button, TextInput, Preloader, Row, Select } from 'react-materialize'

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

    this.zwaveService.getNodesByProvidedFunctions(['multiLevelSwitchGetPercent', 'pilotWireGetLevel'])
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
    const { title = '', nodeId = 0, orders = 4 } = this.state.params
    const { animationLevel } = mainState()

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div className='clearing padded'>
        <Row className='padded card'>
          <Select s={12} label='Choose a Z-wave device' icon='brightness_4'
            onChange={this.handleEventChange.bind(this, 'nodeId')} value={`${nodeId}`}>
            {compatibleNodes.map((node) => (
              <option key={node.nodeid} value={`${node.nodeid}`}>{node.name}</option>
            ))}
          </Select>

          <TextInput placeholder='Pilot wire title' s={12} m={10} l={10} label='Label'
            value={title} onChange={this.handleEventChange.bind(this, 'title')} />

          <Select s={12} label='Orders to show' onChange={this.handleEventChange.bind(this, 'orders')} value={`${orders}`}>
            <option key={3} value='3'>3 (Comfort, Economic, Frost free)</option>
            <option key={4} value='4'>4 (Comfort, Economic, Frost free, Off)</option>
            <option key={5} value='5'>5 (Comfort, Comfort-1°C, Comfort-2°C, Economic, Frost free)</option>
            <option key={6} value='6'>6 (Comfort, Comfort-1°C, Comfort-2°C, Economic, Frost free, Off)</option>
          </Select>
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
