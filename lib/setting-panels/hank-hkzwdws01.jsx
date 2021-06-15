'use strict'

import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Row } from 'react-materialize'

import NameLocation from './name-location'

class HankHkzwdws01SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props, HankHkzwdws01SettingPanel.configurations)
    this.withBatteryLevelSupport()

    this.state.configChanged = false
    this.state.isAccessControlAlarm = 'Unknown'
    this.state.isBurglarAlarm = 'Unknown'
    this.state.stateId = null
    this.state.stateBehavior = 1
    this.state.forceBitmaskStatePosition = true
  }

  // TODO !0: componentDidMount, do equivalent to :
  /**
    Promise.all([
      o.isAccessControlAlarmOn ? o.isAccessControlAlarmOn() : 'Unknown',
      o.isBurglarAlarmOn ? o.isBurglarAlarmOn() : 'Unknown',
      o.getStateId(),
      o.getStateBehavior(),
      o.getForceBitmaskStatePosition()
    ])
    .then(([isAccessControlAlarm, isBurglarAlarm, stateId, stateBehavior, forceBitmaskStatePosition]) => {
      this.setState({
        isAccessControlAlarm,
        isBurglarAlarm,
        stateId,
        stateBehavior,
        forceBitmaskStatePosition
      })
      this.plugWidgets()
    })
    .catch(console.error)
  **/

  render () {
    const { animationLevel, theme, productObjectProxy } = this.props
    const { batteryPercent, batteryIcon, panelReady, configChanged } = this.state

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m12 l8'>Door/Window sensor settings</h4>
          <div className='right'>
            <i className={cx('material-icons', batteryIcon)}>{batteryIcon}</i>&nbsp;{batteryPercent}%
          </div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <Row className='section card form'>
          <h5>TODO: normally opened/closed boolean; then other state features like in FibaroFgdw002</h5>

          {configChanged && (
            <div className='col s12'>
              <br/>
              Settings changed. You must press 3 times the internal Z button, to save parameters.
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
  NORMAL_STATE: 1
}

export default HankHkzwdws01SettingPanel
