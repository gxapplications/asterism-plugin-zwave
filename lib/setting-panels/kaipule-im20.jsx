'use strict'

import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Row, Select } from 'react-materialize'

import { Scenarii } from 'asterism-plugin-library'

import NameLocation from './name-location'
import alarmMapper from '../products/kaipule-im20-alarm-mapper'

const { StatesDropdown } = Scenarii

class KaipuleIm20SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props)
    this.withBatteryLevelSupport()
    this.withAlarmSupport(alarmMapper)

    this.state.stateId = null
    this.state.stateBehavior = 1
    this.state.forceBitmaskStatePosition = true
    this.state.muteAlarm6 = false
  }

  componentDidMount () {
    const pop = this.props.productObjectProxy
    Promise.all([
      pop.getStateId(),
      pop.getStateBehavior(),
      pop.getForceBitmaskStatePosition(),
      pop.alarmGetMuteIndex(6)
    ])
      .then(([stateId, stateBehavior, forceBitmaskStatePosition, muteAlarm6]) => {
        return super.componentDidMount({
          stateId,
          stateBehavior,
          forceBitmaskStatePosition,
          muteAlarm6
        })
      })
      .catch(console.error)
  }

  render () {
    const { nodeId, animationLevel, theme, productObjectProxy, services } = this.props
    const { batteryPercent, batteryIcon, panelReady, stateId, stateBehavior, forceBitmaskStatePosition, muteAlarm6 } = this.state
    const { alarmStatuses } = this.state.alarms

    let alarming = (alarmStatuses['6'] === true) ? 'Opened alarm' : 'Normally closed'
    alarming = (alarmStatuses['7'] === true) ? 'Burglar alarm' : ((alarmStatuses['6'] === 'Unknown') ? 'Unknown' : alarming)

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m12 l8'>Door/Window sensor settings</h4>
          <div className='col s12 m9 l5'>Sensor #{nodeId} state actually "{alarming}".</div>
          <div className='right'>
            <i className={cx('material-icons', batteryIcon)}>{batteryIcon}</i>&nbsp;{batteryPercent}%
          </div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <Row className='section card form'>
          <h5>Link state to a scenarii bitmask state</h5>
          <div className='col s12 m6'>
            <StatesDropdown defaultStateId={stateId} onChange={this.stateIdChange.bind(this)}
              theme={theme} animationLevel={animationLevel} services={services}
              typeFilter={(e) => e.id === 'bitmask-state'} instanceFilter={(e) => e.typeId === 'bitmask-state'}>
              <option key='no-state-option' value={''}>No link</option>
            </StatesDropdown>
          </div>

          {stateId && stateId.length > 0 && [
            <Select key={0} s={12} m={6} label='Choose bitmask state position behavior'
              onChange={this.stateBehaviorChange.bind(this)} value={`${stateBehavior}`}>
              <option value='1'>Set state position 1 (to 1) when opened</option>
              <option value='-1'>Set state position 1 (to 1) when closed</option>
              <option value='2'>Set state position 2 (to 1) when opened</option>
              <option value='-2'>Set state position 2 (to 1) when closed</option>
              <option value='4'>Set state position 3 (to 1) when opened</option>
              <option value='-4'>Set state position 3 (to 1) when closed</option>
              <option value='8'>Set state position 4 (to 1) when opened</option>
              <option value='-8'>Set state position 4 (to 1) when closed</option>
              <option value='16'>Set state position 5 (to 1) when opened</option>
              <option value='-16'>Set state position 5 (to 1) when closed</option>
              <option value='32'>Set state position 6 (to 1) when opened</option>
              <option value='-32'>Set state position 6 (to 1) when closed</option>
              <option value='64'>Set state position 7 (to 1) when opened</option>
              <option value='-64'>Set state position 7 (to 1) when closed</option>
              <option value='128'>Set state position 8 (to 1) when opened</option>
              <option value='-128'>Set state position 8 (to 1) when closed</option>
              <option value='256'>Set state position 9 (to 1) when opened</option>
              <option value='-256'>Set state position 9 (to 1) when closed</option>
              <option value='512'>Set state position 10 (to 1) when opened</option>
              <option value='-512'>Set state position 10 (to 1) when closed</option>
            </Select>,
            <div key={1} className='col s12'>
              <div className='switch'>
                <label>
                  <input type='checkbox' name='force-bitmask-state-position' value='force-bitmask-state-position' checked={forceBitmaskStatePosition}
                    onChange={() => { this.changeForceBitmaskStatePosition(!forceBitmaskStatePosition) }} />
                  <span className='lever'></span>
                  Force control on the state position (other actions to change it will fail)
                </label>
              </div>
            </div>
          ]}
        </Row>

        <Row className='section card form'>
          <h5>Mute alarm types</h5>
          <div className='col s12'>
            <div className='switch'>
              <label>
                <input type='checkbox' name='mute-alarm-6' value='mute-alarm-6' checked={muteAlarm6}
                  onChange={() => { this.muteAlarm6(!muteAlarm6) }} />
                <span className='lever'></span>
                Mute Opened/Closed sensor alarm (notifications only)
              </label>
            </div>
          </div>
        </Row>
      </div>
    ) : super.render()
  }

  stateIdChange (value) {
    this.props.productObjectProxy.setStateId(value)
      .then(() => {
        this.setState({
          stateId: value
        })
      })
      .catch(console.error)
  }

  stateBehaviorChange (event) {
    const value = parseInt(event.currentTarget.value)
    this.props.productObjectProxy.setStateBehavior(value)
      .then(() => {
        this.setState({
          stateBehavior: value
        })
      })
      .catch(console.error)
  }

  changeForceBitmaskStatePosition (value) {
    this.props.productObjectProxy.setForceBitmaskStatePosition(value)
      .then(() => {
        this.setState({
          forceBitmaskStatePosition: value
        })
      })
      .catch(console.error)
  }

  muteAlarm6 (value) {
    this.props.productObjectProxy.alarmSetMuteIndex(6, value)
    .then(() => {
      this.setState({
        muteAlarm6: value
      })
    })
    .catch(console.error)
  }
}

KaipuleIm20SettingPanel.propTypes = {
  ...BaseSettingPanel.propTypes,
  reconfigureElement: PropTypes.func.isRequired
}

export default KaipuleIm20SettingPanel
