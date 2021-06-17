'use strict'

import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Row } from 'react-materialize'

import NameLocation from './name-location'
import alarmMapper from '../products/hank-hkzwdws01-alarm-mapper'

class HankHkzwdws01SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props, HankHkzwdws01SettingPanel.configurations)
    this.withBatteryLevelSupport()
    this.withAlarmSupport(alarmMapper)

    this.state.configChanged = false
    this.state.stateId = null
    this.state.stateBehavior = 1
    this.state.forceBitmaskStatePosition = true
  }

  componentDidMount () {
    const pop = this.props.productObjectProxy
    Promise.all([
      pop.getStateId(),
      pop.getStateBehavior(),
      pop.getForceBitmaskStatePosition()
    ])
      .then(([stateId, stateBehavior, forceBitmaskStatePosition]) => {
        return super.componentDidMount({
          stateId,
          stateBehavior,
          forceBitmaskStatePosition
        })
      })
      .catch(console.error)
  }

  plugWidgets () {
    // TODO !0: from here
  }

  render () {
    const { nodeId, animationLevel, theme, productObjectProxy } = this.props
    const { batteryPercent, batteryIcon, panelReady, configChanged, configuration } = this.state
    const { alarmMapper, alarmStatuses } = this.state.alarms

    const configs = HankHkzwdws01SettingPanel.configurations

    const normalState = configuration[configs.NORMAL_STATE] === 0 || configuration[configs.NORMAL_STATE] === 'Closed' || configuration[configs.NORMAL_STATE] === 'Door/Window Closed'
    let alarming = (normalState && alarmStatuses['6']) ? 'Closed alarm' : ((!normalState && alarmStatuses['6']) ? 'Opened alarm' : (normalState ? 'Normally opened' : 'Normally closed'))
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

        <h5>Configuration not supported</h5>
        <Row className='section card form'>
          Configuration failed to work with asterism for now, so you cannot change them here.
          {/* configuration[configs.NORMAL_STATE] */}
          {/* configuration[configs.LOW_BATTERY_ALARM] */}
        </Row>

        <h5>Link state to a scenarii bitmask state</h5>
        <Row className='section card form'>
          <h5>TODO !0: other state features like in FibaroFgdw002</h5>

          {configChanged && (
            <div className='col s12'>
              <br />
              Settings changed. You must press the internal Z button during 5 seconds, to save parameters.
            </div>
          )}
        </Row>
      </div>
    ) : super.render()
  }
}

HankHkzwdws01SettingPanel.propTypes = {
  ...BaseSettingPanel.propTypes,
  reconfigureElement: PropTypes.func.isRequired
}

HankHkzwdws01SettingPanel.configurations = {
  NORMAL_STATE: 15,
  LOW_BATTERY_ALARM: 32
}

export default HankHkzwdws01SettingPanel
