'use strict'

/* global wNumb */
import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Checkbox, Row, Select, Button } from 'react-materialize'

import NameLocation from './name-location'
import alarmMapper from '../products/philio-pse04-alarm-mapper'

class PhilioPse04SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props, PhilioPse04SettingPanel.configurations)
    this.withBatteryLevelSupport()
    this.withAlarmSupport(alarmMapper)

    this.state = {
      ...this.state,
      playSoundControlConf: null,
      customerFunctionConf: null,
      temperature: null
    }
  }

  componentDidMount () {
    const pop = this.props.productObjectProxy
    Promise.all([
      pop.getPlaySoundControlConf(),
      pop.getCustomerFunctionConf(),
      pop.sensorMultiLevelGetFormatted()
    ])
      .then(([playSoundControlConf, customerFunctionConf, temperature]) => {
        return super.componentDidMount({
          playSoundControlConf,
          customerFunctionConf,
          temperature
        })
      })
      .catch(console.error)
  }

  plugWidgets () {
    this.plugConfigurationSlider(
      'auto-report-tick-interval-slider',
      PhilioPse04SettingPanel.configurations.AUTO_REPORT_TICK_INTERVAL,
      30,
      {
        range: {
          'min': [0, 1],
          '35%': [15, 5],
          '62%': [60, 15],
          'max': [250]
        },
        pips: { // Show a scale with the slider
          mode: 'steps',
          stepped: true,
          density: 2,
          format: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${v}`.split('.')[0] + '?' })
        },
        tooltips: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${v}`.split('.')[0] + '?' })
      },
      this.changeAutoReportTickIntervalConfiguration.bind(this)
    )
    this.plugConfigurationSlider(
      'auto-report-temperature-time-slider',
      PhilioPse04SettingPanel.configurations.AUTO_REPORT_TEMPERATURE_TIME,
      12,
      {
        range: {
          'min': [0, 1],
          '35%': [15, 5],
          '62%': [60, 15],
          'max': [250]
        },
        pips: { // Show a scale with the slider
          mode: 'steps',
          stepped: true,
          density: 2,
          format: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${v}`.split('.')[0] + '?' })
        },
        tooltips: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${v}`.split('.')[0] + '?' })
      },
      this.changeAutoReportTemperatureTimeConfiguration.bind(this)
    )
    this.plugConfigurationSlider(
      'auto-report-battery-time-slider',
      PhilioPse04SettingPanel.configurations.AUTO_REPORT_BATTERY_TIME,
      12,
      {
        range: {
          'min': [0, 1],
          '35%': [15, 5],
          '62%': [60, 15],
          'max': [250]
        },
        pips: { // Show a scale with the slider
          mode: 'steps',
          stepped: true,
          density: 2,
          format: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${v}`.split('.')[0] + '?' })
        },
        tooltips: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${v}`.split('.')[0] + '?' })
      },
      this.changeAutoReportBatteryTimeConfiguration.bind(this)
    )
    this.plugConfigurationSlider(
      'temperature-differential-report-slider',
      PhilioPse04SettingPanel.configurations.TEMPERATURE_DIFFERENTIAL_REPORT,
      0,
      {
        range: {
          'min': [0, 1],
          '35%': [15, 5],
          '62%': [60, 15],
          'max': [250]
        },
        pips: { // Show a scale with the slider
          mode: 'steps',
          stepped: true,
          density: 2,
          format: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${v}`.split('.')[0] + '?' })
        },
        tooltips: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${v}`.split('.')[0] + '?' })
      },
      this.changeTemperatureDifferentialReportConfiguration.bind(this)
    )
    this.plugConfigurationSlider(
      'sound-duration-slider',
      PhilioPse04SettingPanel.configurations.SOUND_DURATION,
      6,
      {
        range: {
          'min': [0, 1],
          '35%': [15, 5],
          '62%': [60, 15],
          'max': [250]
        },
        pips: { // Show a scale with the slider
          mode: 'steps',
          stepped: true,
          density: 2,
          format: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${v*30}`.split('.')[0] + '?' })
        },
        tooltips: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${v*30}`.split('.')[0] + '?' })
      },
      this.changeSoundDuration.bind(this)
    )
  }

  render () {
    const { nodeId, animationLevel, theme, productObjectProxy } = this.props
    const { batteryPercent, batteryIcon, panelReady, temperature } = this.state
    const { soundLevel, soundTone } = this.state.playSoundControlConf || {}
    const { disableTriggerAlarm, disableSound, temperatureUnitInCelsius } = this.state.customerFunctionConf || {}
    const { alarmStatuses } = this.state.alarms

    let alarming = (alarmStatuses['14'] === true) ? 'Siren alerts' : 'Clear'
    alarming = (alarmStatuses['7'] === true) ? 'Burglar alarm' : ((alarmStatuses['14'] === 'Unknown') ? 'Unknown' : alarming)

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m12 l8'>PSE04 Siren</h4>
          <div className='col s12 m9 l5'>Siren #{nodeId} state actually "{alarming}".</div>
          <div className='right'>
            <i className={cx('material-icons', batteryIcon)}>{batteryIcon}</i>&nbsp;{batteryPercent}% &nbsp; / {temperature}
          </div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <Row>
          <Button s={12} m={6} l={6} onClick={() => this.props.productObjectProxy.playTone(0)}>Stop sound</Button>
          <Button s={12} m={6} l={6} onClick={() => this.props.productObjectProxy.playTone(255)}>Test siren</Button>
          <Button s={12} m={6} l={6} onClick={() => this.props.productObjectProxy.playTone(5)}>Test "Dingdong"</Button>
          <Button s={12} m={6} l={6} onClick={() => this.props.productObjectProxy.playTone(6)}>Test "Beep"</Button>
        </Row>

        <h5>Siren / sound</h5>
        <Row className='section card form'>
          <div className='col s12 m5 l5'>
            <Checkbox
              className='filled-in' value='1' label='Disable trigger alarm'
              onChange={() => { this.changeCustomerFunction({ disableTriggerAlarm: !disableTriggerAlarm }) }}
              checked={disableTriggerAlarm}
            />
          </div>

          <div className='col s12 m5 l5'>
            <Checkbox
              className='filled-in' value='2' label='Disable sound'
              onChange={() => { this.changeCustomerFunction({ disableSound: !disableSound }) }}
              checked={disableSound}
            />
          </div>

          <Select
            s={12} m={6} label='Default siren level'
            onChange={(v) => this.changePlaySoundControl({ soundLevel: parseInt(v.currentTarget.value) })}
            value={`${soundLevel}`}
          >
            <option disabled>Default siren level</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </Select>

          <Select
            s={12} m={6} label='Default siren tone'
            onChange={(v) => this.changePlaySoundControl({ soundTone: parseInt(v.currentTarget.value) })}
            value={`${soundTone}`}
          >
            <option disabled>Default siren tone</option>
            <option value={0}>Stop</option>
            <option value={1}>Fire</option>
            <option value={2}>Ambulance</option>
            <option value={3}>Police</option>
            <option value={4}>Alarm</option>
            <option value={5}>Ding dong</option>
            <option value={6}>Beep</option>
          </Select>

          <div className='col s12'>
            Sound duration
          </div>
          <div className='col s12 slider'>
            <div id={`sound-duration-slider-${nodeId}`} />
          </div>

          TODO !0 : tone set, comment ca fait doublon (ou pas) avec "default siren tone" ?
          TODO !0 : volume set, comment ca fait doublon (ou pas) avec "default siren level" 1-3 ?
          <br />
          <Button onClick={() => this.props.productObjectProxy.setToneAndVolume(1, 10)}>set 1, fire, v10</Button>
          <Button onClick={() => this.props.productObjectProxy.setToneAndVolume(4, 5)}>set 4, alarm, v5</Button>
          <Button onClick={() => this.props.productObjectProxy.setToneAndVolume(5, 10)}>set 5, dingdong, v10</Button>
          <Button onClick={() => this.props.productObjectProxy.setToneAndVolume(6, 10)}>set 6, beep, v10</Button>
        </Row>

        <h5>Status reporting</h5>
        <Row className='section card form'>
          <div className='col s12'>
            Auto report tick interval
          </div>
          <div className='col s12 slider'>
            <div id={`auto-report-tick-interval-slider-${nodeId}`} />
          </div>

          <div className='col s12'>
            <br />Auto report battery time
          </div>
          <div className='col s12 slider'>
            <div id={`auto-report-battery-time-slider-${nodeId}`} />
          </div>

          <div className='col s12'>
            <br />Auto report temperature time
          </div>
          <div className='col s12 slider'>
            <div id={`auto-report-temperature-time-slider-${nodeId}`} />
          </div>

          <div className='col s12'>
            <br />Temperature differential report
          </div>
          <div className='col s12 slider'>
            <div id={`temperature-differential-report-slider-${nodeId}`} />
          </div>

          <Select
            s={12} m={6} label='Temperature unit'
            onChange={(v) => this.changeCustomerFunction({ temperatureUnitInCelsius: !!v })}
            value={`${temperatureUnitInCelsius ? 1 : 0}`}
          >
            <option disabled>Temperature unit</option>
            <option value={0}>Fahrenheit</option>
            <option value={1}>Celsius</option>
          </Select>
        </Row>
      </div>
    ) : super.render()
  }

  changeAutoReportTickIntervalConfiguration (value) {
    const index = PhilioPse04SettingPanel.configurations.AUTO_REPORT_TICK_INTERVAL
    return this.changeConfiguration(index, value[0], parseInt)
  }

  changeAutoReportTemperatureTimeConfiguration (value) {
    const index = PhilioPse04SettingPanel.configurations.AUTO_REPORT_TEMPERATURE_TIME
    return this.changeConfiguration(index, value[0], parseInt)
  }

  changeAutoReportBatteryTimeConfiguration (value) {
    const index = PhilioPse04SettingPanel.configurations.AUTO_REPORT_BATTERY_TIME
    return this.changeConfiguration(index, value[0], parseInt)
  }

  changeTemperatureDifferentialReportConfiguration (value) {
    const index = PhilioPse04SettingPanel.configurations.TEMPERATURE_DIFFERENTIAL_REPORT
    return this.changeConfiguration(index, value[0], parseInt)
  }

  changeCustomerFunction (customerFunctionConf) {
    this.props.productObjectProxy.setCustomerFunctionConf(customerFunctionConf)
      .then(() => {
        this.setState({ customerFunctionConf: { ...this.state.customerFunctionConf, ...customerFunctionConf } })
      })
      .catch(console.error)
  }

  changePlaySoundControl (playSoundControlConf) {
    this.props.productObjectProxy.setPlaySoundControlConf(playSoundControlConf)
      .then(() => {
        this.setState({ playSoundControlConf: { ...this.state.playSoundControlConf, ...playSoundControlConf } })
      })
      .catch(console.error)
  }

  changeSoundDuration (value) {
    const index = PhilioPse04SettingPanel.configurations.SOUND_DURATION
    return this.changeConfiguration(index, value[0], parseInt) // TODO !0: /30 ?
  }
}

PhilioPse04SettingPanel.propTypes = {
  ...BaseSettingPanel.propTypes,
  reconfigureElement: PropTypes.func.isRequired
}

PhilioPse04SettingPanel.configurations = {
  AUTO_REPORT_TICK_INTERVAL: 1,
  SOUND_DURATION: 2,
  CUSTOMER_FUNCTION: 3,
  AUTO_REPORT_TEMPERATURE_TIME: 4,
  TEMPERATURE_DIFFERENTIAL_REPORT: 5,
  AUTO_REPORT_BATTERY_TIME: 6,
  PLAY_SOUND_CONTROL: 7
}

export default PhilioPse04SettingPanel
