'use strict'

/* global wNumb */
import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Checkbox, Row, Select } from 'react-materialize'

import NameLocation from './name-location'

class PhilioPse04SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props, PhilioPse04SettingPanel.configurations)
    this.withBatteryLevelSupport()

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
          '65%': [60, 15],
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
          '65%': [60, 15],
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
          '65%': [60, 15],
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
          '65%': [60, 15],
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
  }

  render () {
    const { nodeId, animationLevel, theme, productObjectProxy } = this.props
    const { batteryPercent, batteryIcon, panelReady, playSoundControlConf, customerFunctionConf, temperature } = this.state
    const { soundLevel, soundTone } = playSoundControlConf || {}
    const { disableTriggerAlarm, disableSound, temperatureUnitInCelsius } = customerFunctionConf || {}

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m12 l8'>PSE04 Siren</h4>
          <div className='right'>
            <i className={cx('material-icons', batteryIcon)}>{batteryIcon}</i>&nbsp;{batteryPercent}% &nbsp; / {temperature}
          </div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <h5>Siren / sound</h5>
        <Row className='section card form'>
          TODO !0: PLAY_SOUND_CONTROL => sound level (dropdown 1-2-3) {soundLevel}

          TODO !0: PLAY_SOUND_CONTROL => sound tone (dropdown 7 choices stop-fire-ambulance-police-alarm-dingdong-beep) {soundTone}

          TODO !0: SOUND_DURATION (slider)

          <div className='col s12 m6 l3'>
            <Checkbox
              className='filled-in' value='1' label='Disable trigger alarm'
              onChange={() => { this.changeCustomerFunction({ disableTriggerAlarm: !disableTriggerAlarm }) }}
              checked={disableTriggerAlarm}
            />
          </div>
          <div className='col s12 m6 l3'>
            <Checkbox
              className='filled-in' value='2' label='Disable sound'
              onChange={() => { this.changeCustomerFunction({ disableSound: !disableSound }) }}
              checked={disableSound}
            />
          </div>
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
        this.setState({ customerFunctionConf })
      })
      .catch(console.error)
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
