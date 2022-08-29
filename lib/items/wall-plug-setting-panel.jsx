'use strict'

import cx from 'classnames'
import React from 'react'
import { Button, TextInput, Select, Preloader, Row } from 'react-materialize'

import { ItemSettingPanel, IconPicker, ActionColorSwitch } from 'asterism-plugin-library'

import WallPlugItem from './wall-plug'

class WallPlugItemSettingPanel extends ItemSettingPanel {
  constructor (props) {
    super(props)

    this.zwaveService = props.context.services['asterism-plugin-zwave']
    this.state.compatibleNodes = []
    this.state.panelReady = false
    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this.zwaveService.getNodesByProvidedFunctions(['binarySwitchInvert', 'binarySwitchTurnOn',
      'binarySwitchTurnOff', 'binarySwitchGetState'])
    .then((nodes) => {
      if (this._mounted) {
        this.setState({
          compatibleNodes: nodes,
          panelReady: true
        })
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
    const { title = '', nodeId = 0, color = 'secondary', icon = 'power' } = this.state.params
    let { showPower, showConsumption } = this.state.params
    const { animationLevel } = mainState()

    const waves = animationLevel >= 2 ? 'light' : undefined
    const selectedNode = compatibleNodes.find((node) => node.nodeid == nodeId)

    if (showPower === undefined) {
      showPower = true
    }

    if (showConsumption === undefined) {
      showConsumption = true
    }

    const energyLevelCompatible = selectedNode ? (selectedNode.meta.settingPanelProvidedFunctions.includes('sensorMultiLevelGetValue')) : false
    const meterCompatible = selectedNode ? (
      selectedNode.meta.settingPanelProvidedFunctions.includes('meterGetLastValue') &&
      selectedNode.meta.settingPanelProvidedFunctions.includes('sensorMultiLevelGetHistory')
    ) : false

    return panelReady ? (
      <div className='clearing padded'>
        <Row className='padded card'>
          <Select s={12} label='Z-wave device' icon='power'
            onChange={this.handleEventChange.bind(this, 'nodeId')} value={`${nodeId}`}>
            <option value='' disabled>{compatibleNodes.length ? 'Choose a device' : 'No compatible device available'}</option>
            {compatibleNodes.map((node) => (
              <option key={node.nodeid} value={`${node.nodeid}`}>{node.name}</option>
            ))}
          </Select>
          <IconPicker theme={theme} animationLevel={animationLevel} defaultIcon={icon} onChange={this.handleValueChange.bind(this, 'icon')} />
          <TextInput placeholder='Button title' s={12} m={10} l={10} label='Label'
            value={title} onChange={this.handleEventChange.bind(this, 'title')} />

          {energyLevelCompatible ? (
            <div className='col s12'>
              <br />
              <div className='switch'>
                <label>
                  Power: &nbsp; Hide
                  <input type='checkbox' name='show-power' value='show-power' checked={showPower}
                    onChange={() => { this.handleValueChange('showPower', !showPower) }} />
                  <span className='lever'></span>
                  Show
                </label>
              </div>
            </div>
          ) : null}

          {meterCompatible ? (
            <div className='col s12'>
              <br />
              <div className='switch'>
                <label>
                  Consumption: &nbsp; Hide
                  <input type='checkbox' name='show-consumption' value='show-consumption' checked={showConsumption}
                    onChange={() => { this.handleValueChange('showConsumption', !showConsumption) }} />
                  <span className='lever'></span>
                  Show
                </label>
              </div>
            </div>
          ) : null}
        </Row>

        <ActionColorSwitch theme={theme} animationLevel={animationLevel} defaultColor={color} onChange={this.handleValueChange.bind(this, 'color')} />

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
    this.next(WallPlugItem, this.state.params)
  }
}

export default WallPlugItemSettingPanel
