'use strict'

import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Row } from 'react-materialize'

import NameLocation from './name-location'

class FibaroFgpb101SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props)
    this.withBatteryLevelSupport()
  }

  render () {
    const { animationLevel, theme, productObjectProxy } = this.props
    const { batteryPercent, batteryIcon, panelReady } = this.state

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m12 l8'>The button settings</h4>
          <div className='right'>
            <i className={cx('material-icons', batteryIcon)}>{batteryIcon}</i>&nbsp;{batteryPercent}%
          </div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <Row className='section card form'>
          <h5>No more configuration from here</h5>
          This Fibaro Scene controller does not allow configuration yet.
          To catch button actions, you need to create a <b>Central Scene Trigger</b> from
          the Scenarii panel (Triggers tab), then use the "learn" feature and press the button you want.

          <h5>Button does not trigger anything ?</h5>
          Maybe you need to force the controller to wake up and say hello to asterism.
          To do that, please click 4 times quickly on the button. This may fix the problem.
        </Row>
      </div>
    ) : super.render()
  }
}

FibaroFgpb101SettingPanel.propTypes = {
  ...BaseSettingPanel.propTypes,
  reconfigureElement: PropTypes.func.isRequired
}

export default FibaroFgpb101SettingPanel
