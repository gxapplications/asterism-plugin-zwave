'use strict'

import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Preloader, Row, Select } from 'react-materialize'

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
      o.getConfiguration(configs.ALARM_SOUND_DURATION_TIME),
      o.getConfiguration(configs.DOOR_BELL_SOUND_DURATION_TIME),
      o.getConfiguration(configs.DOOR_BELL_SOUND_VOLUME),
      o.getConfiguration(configs.ALARM_SOUND_INDEX),
      o.getConfiguration(configs.DOOR_BELL_SOUND_INDEX),
      o.getConfiguration(configs.DEFAULT_SIREN_ON_MODE),
      o.getConfiguration(configs.ALARM_LED_ENABLED),
      o.getConfiguration(configs.DOOR_BELL_LED_ENABLED)
    ])
    .then(([batteryPercent, batteryIcon, switchState, alarmSoundVolume, alarmSoundDuration, doorBellSoundDuration,
        doorBellSoundVolume, alarmIndex, doorBellIndex, defaultSirenOnMode, alarmLed, doorBellLed]) => {
      this.setState({
        batteryPercent: (batteryPercent === 'N/A') ? 'N/A' : Math.round(batteryPercent),
        batteryIcon,
        switchState,
        panelReady: true,
        configuration: {
          [configs.ALARM_SOUND_VOLUME]: alarmSoundVolume,
          [configs.ALARM_SOUND_DURATION_TIME]: alarmSoundDuration,
          [configs.DOOR_BELL_SOUND_DURATION_TIME]: doorBellSoundDuration,
          [configs.DOOR_BELL_SOUND_VOLUME]: doorBellSoundVolume,
          [configs.ALARM_SOUND_INDEX]: alarmIndex,
          [configs.DOOR_BELL_SOUND_INDEX]: doorBellIndex,
          [configs.DEFAULT_SIREN_ON_MODE]: defaultSirenOnMode,
          [configs.ALARM_LED_ENABLED]: alarmLed,
          [configs.DOOR_BELL_LED_ENABLED]: doorBellLed
        }
      })
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }

  getConfigValues (configuration) {
    const c = CoolcamSirenSettingPanel.configurations
    const volumes = ['Low', 'Middle', 'High']
    const durations = ['Off', '30 second', '1 minute', '5 minute', 'Always on']
    const alarmSounds = ['Doorbell', 'Fur Elise', 'Doorbell Extended', 'Alert', 'William Tell',
      'Rondo Alla Turca', 'Police Siren', 'Evacuation', 'Beep Beep', 'Beep']
    const leds = ['Disable', 'Enable']

    return {
      alarmVolume: Number.isInteger(configuration[c.ALARM_SOUND_VOLUME])
        ? configuration[c.ALARM_SOUND_VOLUME]
        : volumes.indexOf(configuration[c.ALARM_SOUND_VOLUME]),
      alarmDuration: Number.isInteger(configuration[c.ALARM_SOUND_DURATION_TIME])
        ? configuration[c.ALARM_SOUND_DURATION_TIME]
        : durations.indexOf(configuration[c.ALARM_SOUND_DURATION_TIME]),
      alarmSoundIndex: Number.isInteger(configuration[c.ALARM_SOUND_INDEX])
        ? configuration[c.ALARM_SOUND_INDEX]
        : alarmSounds.indexOf(configuration[c.ALARM_SOUND_INDEX]),
      alarmLed: Number.isInteger(configuration[c.ALARM_LED_ENABLED])
        ? configuration[c.ALARM_LED_ENABLED]
        : leds.indexOf(configuration[c.ALARM_LED_ENABLED]),
      defaultSirenOnMode: Number.isInteger(configuration[c.DEFAULT_SIREN_ON_MODE])
        ? configuration[c.DEFAULT_SIREN_ON_MODE]
        : ['Alarm music', 'Door bell music'].indexOf(configuration[c.DEFAULT_SIREN_ON_MODE]),
      doorBellVolume: Number.isInteger(configuration[c.DOOR_BELL_SOUND_VOLUME])
        ? configuration[c.DOOR_BELL_SOUND_VOLUME]
        : volumes.indexOf(configuration[c.DOOR_BELL_SOUND_VOLUME]),
      doorBellDuration: Number.isInteger(configuration[c.DOOR_BELL_SOUND_DURATION_TIME])
        ? configuration[c.DOOR_BELL_SOUND_DURATION_TIME]
        : durations[configuration[c.DOOR_BELL_SOUND_DURATION_TIME]],
      doorBellSoundIndex: Number.isInteger(configuration[c.DOOR_BELL_SOUND_INDEX])
        ? configuration[c.DOOR_BELL_SOUND_INDEX]
        : alarmSounds.indexOf(configuration[c.DOOR_BELL_SOUND_INDEX]),
      doorBellLed: Number.isInteger(configuration[c.DOOR_BELL_LED_ENABLED])
        ? configuration[c.DOOR_BELL_LED_ENABLED]
        : leds.indexOf(configuration[c.DOOR_BELL_LED_ENABLED])
    }
  }

  render () {
    const c = CoolcamSirenSettingPanel.configurations

    const { nodeId, animationLevel, theme, productObjectProxy } = this.props
    const { batteryPercent, batteryIcon, switchState, panelReady, configuration } = this.state
    const { alarmDuration, alarmLed, alarmSoundIndex, alarmVolume, defaultSirenOnMode, doorBellDuration,
      doorBellLed, doorBellSoundIndex, doorBellVolume } = this.getConfigValues(configuration)

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m12 l5'>Siren settings</h4>
          <Button className={cx('col s12 m3 l2 fluid', theme.actions.secondary)} waves={waves}
            onClick={this.binarySwitchStateChange.bind(this)}>Turn {switchState ? 'OFF' : 'ON'}</Button>
          <div className='col s12 m9 l5'>Siren #{nodeId} state actually "{switchState ? 'ON' : 'OFF'}".</div>
          <div className='right'>
            <i className={cx('material-icons', batteryIcon)}>{batteryIcon}</i>&nbsp;{batteryPercent}%
          </div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <h5>Alarm</h5>
        <Row className='section card form'>
          <Select s={12} m={6} label='Alarm sound volume'
            onChange={this.changeConfiguration.bind(this, c.ALARM_SOUND_VOLUME)} value={`${alarmVolume}`}>
            <option value='0'>Low</option>
            <option value='1'>Middle</option>
            <option value='2'>High</option>
          </Select>
          <Select s={12} m={6} label='Alarm sound duration'
            onChange={this.changeConfiguration.bind(this, c.ALARM_SOUND_DURATION_TIME)} value={`${alarmDuration}`}>
            <option value='0'>Off</option>
            <option value='1'>30 seconds</option>
            <option value='2'>1 minute</option>
            <option value='3'>5 minutes</option>
            <option value='4'>Always on</option>
          </Select>
          <Select s={12} m={6} label='Alarm sound type'
            onChange={this.changeConfiguration.bind(this, c.ALARM_SOUND_INDEX)} value={`${alarmSoundIndex}`}>
            <option value='0'>Doorbell</option>
            <option value='1'>Fur Elise</option>
            <option value='2'>Doorbell Extended</option>
            <option value='3'>Alert</option>
            <option value='4'>William Tell</option>
            <option value='5'>Rondo Alla Turca</option>
            <option value='6'>Police Siren</option>
            <option value='7'>Evacuation</option>
            <option value='8'>Beep Beep</option>
            <option value='9'>Beep</option>
          </Select>
          <Select s={12} m={6} label='Alarm LED'
            onChange={this.changeConfiguration.bind(this, c.ALARM_LED_ENABLED)} value={`${alarmLed}`}>
            <option value='0'>Disable</option>
            <option value='1'>Enable</option>
          </Select>
        </Row>

        <h5>Door bell</h5>
        <Row className='section card form'>
          <Select s={12} m={6} label='Door bell sound volume'
            onChange={this.changeConfiguration.bind(this, c.DOOR_BELL_SOUND_VOLUME)} value={`${doorBellVolume}`}>
            <option value='0'>Low</option>
            <option value='1'>Middle</option>
            <option value='2'>High</option>
          </Select>
TODO !0 : door bell durationtime, seems different than for alarm ! integer de 0 à 127. Spec values: 0: jamais, 127 infini.</th>
          <Select s={12} m={6} label='Door bell sound type'
            onChange={this.changeConfiguration.bind(this, c.DOOR_BELL_SOUND_INDEX)} value={`${doorBellSoundIndex}`}>
            <option value='0'>Doorbell</option>
            <option value='1'>Fur Elise</option>
            <option value='2'>Doorbell Extended</option>
            <option value='3'>Alert</option>
            <option value='4'>William Tell</option>
            <option value='5'>Rondo Alla Turca</option>
            <option value='6'>Police Siren</option>
            <option value='7'>Evacuation</option>
            <option value='8'>Beep Beep</option>
            <option value='9'>Beep</option>
          </Select>
          <Select s={12} m={6} label='Door bell LED'
            onChange={this.changeConfiguration.bind(this, c.DOOR_BELL_LED_ENABLED)} value={`${doorBellLed}`}>
            <option value='0'>Disable</option>
            <option value='1'>Enable</option>
          </Select>
        </Row>

// TODO !0: defaultSirenOnMode
      </div>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }

  binarySwitchStateChange () {
    this.props.productObjectProxy.binarySwitchInvert().catch(console.error)
  }

  changeConfiguration (index, value) {
    value = value.currentTarget.value
    this.props.productObjectProxy.setConfiguration(index, parseInt(value))
    .then(() => {
      this.setState({
        configuration: { ...this.state.configuration, [index]: parseInt(value) }
      })
    })
    .catch(console.error)
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
  DEFAULT_SIREN_ON_MODE: 7,
  ALARM_LED_ENABLED: 8,
  DOOR_BELL_LED_ENABLED: 9
}

export default CoolcamSirenSettingPanel
