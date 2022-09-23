'use strict'

import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Checkbox, Row, Select } from 'react-materialize'
import { Scenarii } from 'asterism-plugin-library'

import NameLocation from './name-location'

const { StatesDropdown } = Scenarii

const q2Instance = 2 // Seems to change depending on the env...

class FibaroFgs224SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props, FibaroFgs224SettingPanel.configurations)
    this.withBinarySwitchSupport(q2Instance)

    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      ...this.state,
      stateId: null,
      stateBehavior: null,
      forceBitmaskStatePosition: true,
      controlledBitmaskStatePosition: false,
      pairedNodeId: null,
      pairableNodes: []
    }
  }

  componentDidMount () {
    const pop = this.props.productObjectProxy
    Promise.all([
      pop.getStateId(),
      pop.getStateBehavior(),
      pop.getForceBitmaskStatePosition(),
      pop.getControlledBitmaskStatePosition(),
      pop.getPairedNodeId(),
      this.zwaveService.getNodesByProvidedFunctions(['getPairedNodeId', 'setPairedNodeId'])
        .then((nodes) => nodes.filter((node) => (
            node.nodeid !== this.props.nodeId
          && node.meta.manufacturerid === '0x010f'
          && node.meta.productid === '0x1000'
          && node.meta.producttype === '0x0204'
        )))
    ])
    .then(([stateId, stateBehavior, forceBitmaskStatePosition, controlledBitmaskStatePosition, pairedNodeId, pairableNodes]) => {
      return super.componentDidMount({
        stateId,
        stateBehavior,
        forceBitmaskStatePosition,
        controlledBitmaskStatePosition,
        pairedNodeId,
        pairableNodes: pairableNodes || []
      })
    })
    .catch(console.error)
  }

  render () {
    const c = FibaroFgs224SettingPanel.configurations
    const { animationLevel, theme, productObjectProxy, nodeId, services } = this.props
    const { panelReady, switchStates, stateId, stateBehavior } = this.state
    const { forceBitmaskStatePosition, controlledBitmaskStatePosition, pairedNodeId, pairableNodes } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    const s1ScenesSent = this.configurationValueToBitmask(c.INPUT_SCENE_SENT_S1, 4)
    const s2ScenesSent = this.configurationValueToBitmask(c.INPUT_SCENE_SENT_S2, 4)

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m12 l6'>Double On/Off switch module</h4>
          <Button className={cx('col s12 m3 l2 fluid', theme.actions.secondary)} waves={waves}
            onClick={this.invertBinarySwitchState.bind(this, 1)}>Turn {switchStates[0] ? 'OFF' : 'ON'} Q1</Button>
          <div className='col s12 m3 l1'>Plug #{nodeId} Q1 actually "{switchStates[0] ? 'ON' : 'OFF'}".</div>
          <Button className={cx('col s12 m3 l2 fluid', theme.actions.secondary)} waves={waves}
            onClick={this.invertBinarySwitchState.bind(this, q2Instance)}>Turn {switchStates[q2Instance - 1] ? 'OFF' : 'ON'} Q2</Button>
          <div className='col s12 m3 l1'>Plug #{nodeId} Q2 actually "{switchStates[q2Instance - 1] ? 'ON' : 'OFF'}".</div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <h5>Inputs / Outputs connections</h5>
        <Row className='section card form'>
          {this.renderListConfigurationAsSelect(
            c.REMEMBER_RELAYS_STATES,
            ['Relays remain switched off after restoring power', 'Restore remembered state of relays after restoring power', 'Restore remembered state of relays after restoring power, but for toggle switches (parameter 20/21 set to 1) set the same state as the current state of the switches'],
            { s: 12, m: 12, l: 12, label: 'State of relays after restoring power' }
          )}

          {this.renderListConfigurationAsSelect(
            c.INPUT_TYPE_SWITCH_S1,
            ['Momentary switch', 'Toggle switch (contact closed - On, contact opened - OFF)', 'Toggle switch (device changes status when switch changes status)'],
            { s: 12, m: 12, l: 12, label: 'Switch S1 type' }
          )}

          {this.renderListConfigurationAsSelect(
            c.INPUT_TYPE_SWITCH_S2,
            ['Momentary switch', 'Toggle switch (contact closed - On, contact opened - OFF)', 'Toggle switch (device changes status when switch changes status)'],
            { s: 12, m: 12, l: 12, label: 'Switch S2 type' }
          )}

          {this.renderListConfigurationAsSelect(
            c.INPUTS_REVERSION,
            ['default (S1 - 1st channel, S2 - 2nd channel)', 'reversed (S1 - 2nd channel, S2 - 1st channel)'],
            { s: 12, m: 12, l: 12, label: 'Inputs reversion' }
          )}

          {this.renderListConfigurationAsSelect(
            c.OUTPUT_TYPE_Q1,
            ['Normally Open (relay contacts opened turned off, closed when turned on)', 'Normally Closed (relay contacts closed turned off, opened when turned on)'],
            { s: 12, m: 12, l: 12, label: 'Output Q1 type' }
          )}

          {this.renderListConfigurationAsSelect(
            c.OUTPUT_TYPE_Q2,
            ['Normally Open (relay contacts opened turned off, closed when turned on)', 'Normally Closed (relay contacts closed turned off, opened when turned on)'],
            { s: 12, m: 12, l: 12, label: 'Output Q2 type' }
          )}

          {this.renderListConfigurationAsSelect(
            c.OUTPUTS_REVERSION,
            ['default (Q1 - 1st channel, Q2 - 2nd channel)', 'reversed (Q1 - 2nd channel, Q2 - 1st channel)'],
            { s: 12, m: 12, l: 12, label: 'Outputs reversion' }
          )}

          {this.renderListConfigurationAsSelect(
            c.LOCK_SIMULTANEOUS_OUTPUTS,
            ['Lock disabled', 'Lock enabled'],
            { s: 12, m: 12, l: 12, label: 'Outputs lock (VMC, 2 ways commands)' }
          )}
        </Row>

        <h5>Scenes to send to controller for S1:</h5>
        <Row className='section card form'>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='1' label='Key Pressed 1 time'
              onChange={() => { this.changeConfigurationBitmask(c.INPUT_SCENE_SENT_S1, 4, 0, !s1ScenesSent[0]) }}
              checked={s1ScenesSent[0]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='2' label='Key Pressed 2 times'
              onChange={() => { this.changeConfigurationBitmask(c.INPUT_SCENE_SENT_S1, 4, 1, !s1ScenesSent[1]) }}
              checked={s1ScenesSent[1]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='3' label='Key Pressed 3 times'
              onChange={() => { this.changeConfigurationBitmask(c.INPUT_SCENE_SENT_S1, 4, 2, !s1ScenesSent[2]) }}
              checked={s1ScenesSent[2]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='4' label='Key hold down and key released'
              onChange={() => { this.changeConfigurationBitmask(c.INPUT_SCENE_SENT_S1, 4, 3, !s1ScenesSent[3]) }}
              checked={s1ScenesSent[3]} />
          </div>
        </Row>

        <h5>Scenes to send to controller for S2:</h5>
        <Row className='section card form'>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='1' label='Key Pressed 1 time'
              onChange={() => { this.changeConfigurationBitmask(c.INPUT_SCENE_SENT_S2, 4, 0, !s2ScenesSent[0]) }}
              checked={s2ScenesSent[0]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='2' label='Key Pressed 2 times'
              onChange={() => { this.changeConfigurationBitmask(c.INPUT_SCENE_SENT_S2, 4, 1, !s2ScenesSent[1]) }}
              checked={s2ScenesSent[1]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='3' label='Key Pressed 3 times'
              onChange={() => { this.changeConfigurationBitmask(c.INPUT_SCENE_SENT_S2, 4, 2, !s2ScenesSent[2]) }}
              checked={s2ScenesSent[2]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='4' label='Key hold down and key released'
              onChange={() => { this.changeConfigurationBitmask(c.INPUT_SCENE_SENT_S2, 4, 3, !s2ScenesSent[3]) }}
              checked={s2ScenesSent[3]} />
          </div>
        </Row>

        <h5>Pair with another module</h5>
        <Row className='section card form'>
          <Select s={12} m={6} label='Choose another FGS-224 to propagate Q1 & Q2 states'
            onChange={this.pairedNodeChange.bind(this)} value={`${pairedNodeId}`}>
            <option value=''>No pair</option>
            {pairableNodes.map((n) => (
              <option value={`${n.nodeid}`}>{n.name}</option>
            ))}
          </Select>
        </Row>

        <h5>Link to a scenarii bitmask state</h5>
        <Row className='section card form'>
          <div className='col s12 m6'>
            <StatesDropdown defaultStateId={stateId} onChange={this.stateIdChange.bind(this)}
              theme={theme} animationLevel={animationLevel} services={services}
              typeFilter={(e) => e.id === 'bitmask-state'} instanceFilter={(e) => e.typeId === 'bitmask-state'}>
              <option key='no-state-option' value={''}>No link</option>
            </StatesDropdown>
          </div>

          {!!stateId && (stateId.length > 0) && [
            <Select key={0} s={12} m={6} label='Choose bitmask state position behavior'
              onChange={this.stateBehaviorChange.bind(this)} value={`${stateBehavior}`}>
              <option value='1'>Set state positions 1 & 2 (to 1) when ON</option>
              <option value='-1'>Set state positions 1 & 2 (to 1) when closed</option>
              <option value='2'>Set state positions 2 & 3 (to 1) when ON</option>
              <option value='-2'>Set state positions 2 & 3 (to 1) when closed</option>
              <option value='4'>Set state positions 3 & 4 (to 1) when ON</option>
              <option value='-4'>Set state positions 3 & 4 (to 1) when closed</option>
              <option value='8'>Set state positions 4 & 5 (to 1) when ON</option>
              <option value='-8'>Set state positions 4 & 5 (to 1) when closed</option>
              <option value='16'>Set state positions 5 & 6 (to 1) when ON</option>
              <option value='-16'>Set state positions 5 & 6 (to 1) when closed</option>
              <option value='32'>Set state positions 6 & 7 (to 1) when ON</option>
              <option value='-32'>Set state positions 6 & 7 (to 1) when closed</option>
              <option value='64'>Set state positions 7 & 8 (to 1) when ON</option>
              <option value='-64'>Set state positions 7 & 8 (to 1) when closed</option>
              <option value='128'>Set state positions 8 & 9 (to 1) when ON</option>
              <option value='-128'>Set state positions 8 & 9 (to 1) when closed</option>
              <option value='256'>Set state positions 9 & 10 (to 1) when ON</option>
              <option value='-256'>Set state positions 9 & 10 (to 1) when closed</option>
            </Select>,
            <Select key={1} s={12} label='Choose bitmask state control behavior' icon='sync_alt'
              onChange={this.changeForceBitmaskStatePosition.bind(this)} value={forceBitmaskStatePosition ? 'force' : (controlledBitmaskStatePosition ? 'controlled' : 'none')}>
              <option value='force'>Force mode: Device will be the only one allowed to control the state</option>
              <option value='none'>Follow mode: Device will follow any state change but can be controlled anyway</option>
              <option value='controlled'>Controlled mode: state and device can control each others (warning: avoid loops with scenario actions!)</option>
            </Select>
          ]}
        </Row>

        <Row className='section card form'>
          <h5>No more configuration from here</h5>
          To catch single/double/triple click actions, you need to create a <b>Central Scene Trigger</b> from
          the Scenarii panel (Triggers tab), then use the "learn" feature and press the button you want.

          <h5>Button does not trigger anything ?</h5>
          Maybe you need to force the controller to wake up and say hello to asterism.
          To do that, please click 4 times quickly on the button. This may fix the problem.
        </Row>
      </div>
    ) : super.render()
  }

  stateIdChange (value) {
    this.props.productObjectProxy.setStateId(value)
    .then(() => {
      this.setState({ stateId: value })
    })
    .catch(console.error)
  }

  stateBehaviorChange (event) {
    const value = parseInt(event.currentTarget.value)
    this.props.productObjectProxy.setStateBehavior(value)
    .then(() => {
      this.setState({ stateBehavior: value })
    })
    .catch(console.error)
  }

  changeForceBitmaskStatePosition (event) {
    const value = event.currentTarget.value
    switch (value) {
      case 'force':
        return this.props.productObjectProxy.setControlledBitmaskStatePosition(false)
        .then(() => this.props.productObjectProxy.setForceBitmaskStatePosition(true))
        .then(() => {
          this.setState({
            forceBitmaskStatePosition: true,
            controlledBitmaskStatePosition: false
          })
        })
        .catch(console.error)
      case 'controlled':
        return this.props.productObjectProxy.setForceBitmaskStatePosition(false)
        .then(() => this.props.productObjectProxy.setControlledBitmaskStatePosition(true))
        .then(() => {
          this.setState({
            forceBitmaskStatePosition: false,
            controlledBitmaskStatePosition: true
          })
        })
        .catch(console.error)
      case 'none':
      default:
        return this.props.productObjectProxy.setControlledBitmaskStatePosition(false)
        .then(() => this.props.productObjectProxy.setForceBitmaskStatePosition(false))
        .then(() => {
          this.setState({
            forceBitmaskStatePosition: false,
            controlledBitmaskStatePosition: false
          })
        })
        .catch(console.error)
    }
  }

  pairedNodeChange (event) {
    const value = parseInt(event.currentTarget.value)
    this.props.productObjectProxy.setPairedNodeId(value)
    .then(() => {
      this.setState({ pairedNodeId: value })
    })
    .catch(console.error)
  }
}

FibaroFgs224SettingPanel.propTypes = {
  ...BaseSettingPanel.propTypes,
  reconfigureElement: PropTypes.func.isRequired
}

FibaroFgs224SettingPanel.configurations = {
  REMEMBER_RELAYS_STATES: 1,
  INPUT_TYPE_SWITCH_S1: 20,
  INPUT_TYPE_SWITCH_S2: 21,
  INPUTS_REVERSION: 24,
  OUTPUTS_REVERSION: 25,
  // 30, 31,32,33,34,35 NOT SUPPORTED : alarm behaviors
  INPUT_SCENE_SENT_S1: 40,
  INPUT_SCENE_SENT_S2: 41,
  // 150, 151, 152, 153, 154, 155 NOT SUPPORTED : output behavior (auto/delay OFF, flashing)
  // 156, 157, 158, 159, 160, 161 NOT SUPPORTED : values sent to association groups
  OUTPUT_TYPE_Q1: 162,
  OUTPUT_TYPE_Q2: 163,
  LOCK_SIMULTANEOUS_OUTPUTS: 164
}

export default FibaroFgs224SettingPanel
