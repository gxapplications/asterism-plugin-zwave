'use strict'

import cx from 'classnames'
import React from 'react'
import { Button, Input, Preloader, Row } from 'react-materialize'

import { ItemSettingPanel, IconPicker, ActionColorSwitch } from 'asterism-plugin-library'

import SensorMultiLevelItem from './sensor-multi-level'

class SensorMultiLevelItemSettingPanel extends ItemSettingPanel {
  constructor (props) {
    super(props)

    this.zwaveService = props.context.services['asterism-plugin-zwave']
    this.state.compatibleNodes = []
    this.state.panelReady = false
    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this.zwaveService.getNodesByProvidedFunctions(['sensorMultiLevelGetValue', 'sensorMultiLevelGetHistory',
      'sensorMultiLevelGetLabel', 'sensorMultiLevelGetUnits', 'sensorMultiLevelGetFormatted'])
    .then((nodes) => Promise.all(nodes.map(
      (n) =>
        this.zwaveService.getProductObjectProxyForNodeId(n.nodeid, n.meta)
        .then((proxy) => Promise.all([
          proxy.sensorMultiLevelGetLabel(),
          proxy.sensorMultiLevelGetUnits()
        ]))
        .then(([label, units]) => {
          n.label = label
          n.units = units
          return n
        })
    )))
    .then((nodes) => {
      if (this._mounted) {
        this.setState({
          compatibleNodes: nodes.length ? nodes : [{ nodeid: 0, name: 'No compatible device available', label: null, units: null }],
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

  componentWillUpdate (nextProps, nextState) {
    // Because of react-materialize bad behaviors...
    if (this.state.params.title !== nextState.params.title) {
      this._title.setState({ value: nextState.params.title })
    }
  }

  render () {
    const { theme, mainState } = this.props.context
    const { compatibleNodes, panelReady } = this.state
    const { title = '', nodeId = 0, color = 'secondary', icon = 'insert_chart_outlined' } = this.state.params
    const { animationLevel } = mainState()

    const waves = animationLevel >= 2 ? 'light' : undefined
    const selectedNode = compatibleNodes.find((node) => node.nodeid == nodeId)

    return panelReady ? (
      <div className='clearing padded'>
        <Row className='padded card'>
          <Input s={12} type='select' label='Choose a Z-wave device' icon='insert_chart_outlined'
            onChange={this.handleEventChange.bind(this, 'nodeId')} value={`${nodeId}`}>
            {compatibleNodes.map((node) => (
              <option key={node.nodeid} value={`${node.nodeid}`}>{node.name}{node.label && ` (${node.label} in ${node.units})`}</option>
            ))}
          </Input>
          <Input placeholder='Button title' s={12} label='Label' ref={(c) => { this._title = c }}
            value={title} onChange={this.handleEventChange.bind(this, 'title')} className='iconPicker'>
            <div>
              <IconPicker theme={theme} animationLevel={animationLevel} defaultIcon={icon} onChange={this.handleValueChange.bind(this, 'icon')} />
            </div>
          </Input>
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
    this.next(SensorMultiLevelItem, this.state.params)
  }
}

export default SensorMultiLevelItemSettingPanel
