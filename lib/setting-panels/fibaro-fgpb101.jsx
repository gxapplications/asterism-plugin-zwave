'use strict'

/* global wNumb */
import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Checkbox, Row } from 'react-materialize'
import debounce from 'debounce'

import NameLocation from './name-location'

const minuter = (seconds) => {
  if (seconds < 3600 * 3) {
    return `${Math.round(seconds / 60)}m`
  }
  return `${Math.round(seconds / 3600)}hrs`
}

class FibaroFgpb101SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props, FibaroFgpb101SettingPanel.configurations)
    this.withBatteryLevelSupport()

    const configs = FibaroFgpb101SettingPanel.configurations
    this.debouncedWakeupInterval = debounce((value) => {
      this.changeConfiguration(configs.WAKEUP_INTERVAL, value)
    }, 1200, false)
  }

  plugWidgets () {
    const config = this.state.configuration
    const configs = FibaroFgpb101SettingPanel.configurations

    this.plugConfigurationSlider(
      'wakeup-interval-slider',
      null,
      config[configs.WAKEUP_INTERVAL] || 0,
      {
        range: {
          'min': [0, 3600],
          '5%': [3600, 60 * 15],
          '50%': [3600 * 3, 3600],
          'max': [64800]
        },
        pips: { // Show a scale with the slider
          mode: 'steps',
          stepped: true,
          density: 4,
          format: wNumb({ decimals: 1, edit: minuter })
        },
        tooltips: wNumb({ decimals: 1, edit: minuter })
      },
      this.changeWakeupInterval.bind(this)
    )
  }

  render () {
    const { animationLevel, theme, productObjectProxy, nodeId } = this.props
    const { batteryPercent, batteryIcon, panelReady, configuration } = this.state

    const c = FibaroFgpb101SettingPanel.configurations
    const wakeupInterval = configuration[c.WAKEUP_INTERVAL]
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
          <div className='col s12'>Wake up interval: actually {minuter(wakeupInterval)}.</div>
          <div className='col s12 slider'>
            <div id={`wakeup-interval-slider-${nodeId}`} />
          </div>

          <div className='col s12 m6 l3'>
            Scenes to send to controller:
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='1' label='Key Pressed 1 time'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7,0, !centralScenesSent[0]) }} checked={centralScenesSent[0]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='2' label='Key Pressed 2 times'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7,1, !centralScenesSent[1]) }} checked={centralScenesSent[1]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='3' label='Key Pressed 3 times'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7,2, !centralScenesSent[2]) }} checked={centralScenesSent[2]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='4' label='Key Pressed 4 times'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7,3, !centralScenesSent[3]) }} checked={centralScenesSent[3]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='5' label='Key Pressed 5 times'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7,4, !centralScenesSent[4]) }} checked={centralScenesSent[4]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='6' label='Key Held Down'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7,5, !centralScenesSent[5]) }} checked={centralScenesSent[5]} />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox className='filled-in' value='7' label='Key Released'
              onChange={() => { this.changeConfigurationBitmask(c.CENTRAL_SCENES_SENT, 7,6, !centralScenesSent[6]) }} checked={centralScenesSent[6]} />
          </div>
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

  changeWakeupInterval (value) {
    if (value > 0) {
      if (value < 3600) {
        value = 3600
      }
      if (value > 64800) {
        value = 64800
      }
    }
    this.setState({
      configuration: { ...this.state.configuration, [FibaroFgpb101SettingPanel.configurations.WAKEUP_INTERVAL]: value }
    })
    this.debouncedWakeupInterval(value)
  }
}

FibaroFgpb101SettingPanel.propTypes = {
  ...BaseSettingPanel.propTypes,
  reconfigureElement: PropTypes.func.isRequired
}

FibaroFgpb101SettingPanel.configurations = {
  WAKEUP_INTERVAL: 0,
  CENTRAL_SCENES_SENT: 1
}

export default FibaroFgpb101SettingPanel
