'use strict'

import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Row } from 'react-materialize'

import NameLocation from './name-location'

class HankHkzwdws01SettingPanel extends BaseSettingPanel {
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
          <h4 className='col s12 m12 l8'>Door/Window sensor settings</h4>
          <div className='right'>
            <i className={cx('material-icons', batteryIcon)}>{batteryIcon}</i>&nbsp;{batteryPercent}%
          </div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <Row className='section card form'>
          <h5>TODO</h5>
        </Row>
      </div>
    ) : super.render()
  }
}

HankHkzwdws01SettingPanel.propTypes = {
  ...BaseSettingPanel.propTypes,
  reconfigureElement: PropTypes.func.isRequired
}

export default HankHkzwdws01SettingPanel
