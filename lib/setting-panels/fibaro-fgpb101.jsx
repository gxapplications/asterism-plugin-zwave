'use strict'

import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Checkbox, Row } from 'react-materialize'

import NameLocation from './name-location'

class FibaroFgpb101SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props, FibaroFgpb101SettingPanel.configurations)
    this.withBatteryLevelSupport()

    this.state.configChanged = false
  }

  render () {
    const { animationLevel, theme, productObjectProxy } = this.props
    const { batteryPercent, batteryIcon, panelReady, configChanged } = this.state

    const c = FibaroFgpb101SettingPanel.configurations
    const centralScenesSent = this.configurationValueToBitmask(c.CENTRAL_SCENES_SENT, 7)

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
          <div className='col s12 m6 l3'>
            Scenes to send to controller:
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='1' label='Key Pressed 1 time'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7, 0, !centralScenesSent[0]) }}
              checked={centralScenesSent[0]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='2' label='Key Pressed 2 times'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7, 1, !centralScenesSent[1]) }}
              checked={centralScenesSent[1]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='3' label='Key Pressed 3 times'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7, 2, !centralScenesSent[2]) }}
              checked={centralScenesSent[2]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='4' label='Key Pressed 4 times'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7, 3, !centralScenesSent[3]) }}
              checked={centralScenesSent[3]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='5' label='Key Pressed 5 times'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7, 4, !centralScenesSent[4]) }}
              checked={centralScenesSent[4]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='6' label='Key Held Down'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7, 5, !centralScenesSent[5]) }}
              checked={centralScenesSent[5]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='7' label='Key Released'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7, 6, !centralScenesSent[6]) }}
              checked={centralScenesSent[6]} />
          </div>
          {configChanged && (
            <div className='col s12'>
              <br/>
              Settings changed. You must press 4 times the button, to save parameters.
            </div>
          )}
        </Row>

        <Row className='section card form'>
          <h5>No more configuration from here</h5>
          To catch button actions, you need to create a <b>Central Scene Trigger</b> from
          the Scenarii panel (Triggers tab), then use the "learn" feature and press the button you want.

          <h5>Button does not trigger anything ?</h5>
          Maybe you need to force the controller to wake up and say hello to asterism.
          To do that, please click 4 times quickly on the button. This may fix the problem.
        </Row>
      </div>
    ) : super.render()
  }

  changeConfigurationBitmask (index, size, position, valueOrFormElement) {
    this.setState({ configChanged: true })
    super.changeConfigurationBitmask(index, size, position, valueOrFormElement)
  }
}

FibaroFgpb101SettingPanel.propTypes = {
  ...BaseSettingPanel.propTypes,
  reconfigureElement: PropTypes.func.isRequired
}

FibaroFgpb101SettingPanel.configurations = {
  CENTRAL_SCENES_SENT: 1
}

export default FibaroFgpb101SettingPanel
