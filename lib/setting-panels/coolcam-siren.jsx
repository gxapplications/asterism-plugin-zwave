'use strict'

import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Preloader, Row } from 'react-materialize'

import NameLocation from './name-location'

class CoolcamSirenSettingPanel extends React.Component {
  constructor (props) {
    super(props)

    const configs = CoolcamSirenSettingPanel.configurations
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      batteryPercent: 0,
      batteryIcon: null,
      switchState: null,
      panelReady: false,
      configuration: {
        [configs.ALARM_SOUND_VOLUME]: null,
        [configs.ALARM_SOUND_DURATION_TIME]: null,
        [configs.DOOR_BELL_SOUND_DURATION_TIME]: null,
        [configs.DOOR_BELL_SOUND_VOLUME]: null,
        [configs.ALARM_SOUND_INDEX]: null,
        [configs.DOOR_BELL_SOUND_INDEX]: null,
        [configs.DEFAULT_SIREN_ON_MODE]: null,
        [configs.ALARM_LED_ENABLED]: null,
        [configs.DOOR_BELL_LED_ENABLED]: null
      }
    }

    this._socket = props.privateSocket
    this._mounted = false
  }

  componentDidMount () {
    const configs = CoolcamSirenSettingPanel.configurations
    this._mounted = true

    this._socket.on('node-event-binary-switch-changed', (nodeId, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }

      if (this._mounted) {
        if (this.state.switchState !== value.value) {
          this.setState({
            switchState: value.value
          })
        }
      }
    })
    this._socket.on('node-event-battery-level-changed', (nodeId, confIndex, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }

      if (this._mounted) {
        if (this.state.batteryPercent !== value.value) {
          this.setState({
            batteryPercent: Math.round(value.value)
          })
        }
      }
    })

    const o = this.props.productObjectProxy
    Promise.all([
      o.batteryLevelGetPercent ? o.batteryLevelGetPercent() : 'N/A',
      o.batteryLevelGetIcon ? o.batteryLevelGetIcon() : '',
      o.binarySwitchGetState(),
      o.getConfiguration(configs.ALARM_SOUND_VOLUME),
      // TODO !0: all configs
    ])
    .then(([batteryPercent, batteryIcon, switchState, alarmSoundVolume]) => {
      this.setState({
        batteryPercent: (batteryPercent === 'N/A') ? 'N/A' : Math.round(batteryPercent),
        batteryIcon,
        switchState,
        panelReady: true,
        configuration: {
          [configs.ALARM_SOUND_VOLUME]: alarmSoundVolume,
          // TODO !0: all configs
        }
      })
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }

  render () {
    const { nodeId, animationLevel, theme, productObjectProxy } = this.props
    const { switchState, panelReady } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>

        TODO !0: button: press = switch ON / release = switch OFF
        TODO !0: battery level

        TODO !1: 9x configs à supporter !
      </div>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }
}

CoolcamSirenSettingPanel.propTypes = {
  serverStorage: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  localStorage: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  privateSocket: PropTypes.object.isRequired,
  productObjectProxy: PropTypes.object.isRequired,
  nodeId: PropTypes.number.isRequired,
}

CoolcamSirenSettingPanel.configurations = {
  ALARM_SOUND_VOLUME: 1,
  ALARM_SOUND_DURATION_TIME: 2,
  DOOR_BELL_SOUND_DURATION_TIME: 3,
  DOOR_BELL_SOUND_VOLUME: 4,
  ALARM_SOUND_INDEX: 5,
  DOOR_BELL_SOUND_INDEX: 6,
  DEFAULT_SIREN_ON_MODE: 7, // ???
  ALARM_LED_ENABLED: 8,
  DOOR_BELL_LED_ENABLED: 9
}

export default CoolcamSirenSettingPanel
