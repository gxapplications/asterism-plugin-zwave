'use strict'

import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Row, Button } from 'react-materialize'
import NameLocation from './name-location'

class QubinoZmnhad1SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props, QubinoZmnhad1SettingPanel.configurations)
    this.withBinarySwitchSupport(1)

    this.state = {
      ...this.state,
      meterLastValueKwh: null,
      meterLastValueW: null
    }
  }

  componentDidMount () {
    this.socket.on('node-event-meter-changed', (nodeId, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }

      if (this.mounted) {
        if (value.index === 0 && this.state.meterLastValueKwh !== value.value) {
          this.setState({
            meterLastValueKwh: value.value
          })
        }
        if (value.index === 2 && this.state.meterLastValueW !== value.value) {
          this.setState({
            meterLastValueW: value.value
          })
        }
      }
    })

    const pop = this.props.productObjectProxy
    Promise.all([
      pop.meterGetLastValue(1, 0), // kWh.
      pop.meterGetLastValue(1, 2), // W.
    ])
    .then(([meterLastValueKwh, meterLastValueW]) => super.componentDidMount({
      meterLastValueKwh: meterLastValueKwh ? meterLastValueKwh.v : false,
      meterLastValueW: meterLastValueW ? meterLastValueW.v : false,
    }))
    .catch(console.error)
  }

  plugWidgets () {
    this.plugConfigurationSlider(
      'auto-off-delay-slider',
      QubinoZmnhad1SettingPanel.configurations.AUTO_OFF_DELAY,
      0,
      {
        range: {
          'min': [0, 1],
          '1%': [1, 1],
          '9%': [10, 5],
          '22%': [60, 30],
          '27%': [120, 60],
          '37%': [360, 120],
          '42%': [600, 600],
          '67%': [3600, 3600],
          'max': [32535]
        },
        pips: { // Show a scale with the slider
          mode: 'steps',
          stepped: true,
          density: 2,
          filter: (v) => ((v >= 120 && v % 60 === 0) || (v < 120 && v % 10 === 0) || (v === 32535)) ? 1 : 0,
          format: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${(v >= 120) ? (v/60) : v}`.split('.')[0] })
        },
        tooltips: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${(v >= 120) ? (v/60) : v}`.split('.')[0] })
      },
      this.changeAutoOffDelay.bind(this)
    )

    this.plugConfigurationSlider(
      'auto-on-delay-slider',
      QubinoZmnhad1SettingPanel.configurations.AUTO_ON_DELAY,
      0,
      {
        range: {
          'min': [0, 1],
          '1%': [1, 1],
          '9%': [10, 5],
          '22%': [60, 30],
          '27%': [120, 60],
          '37%': [360, 120],
          '42%': [600, 600],
          '67%': [3600, 3600],
          'max': [32535]
        },
        pips: { // Show a scale with the slider
          mode: 'steps',
          stepped: true,
          density: 2,
          filter: (v) => ((v >= 120 && v % 60 === 0) || (v < 120 && v % 10 === 0) || (v === 32535)) ? 1 : 0,
          format: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${(v >= 120) ? (v/60) : v}`.split('.')[0] })
        },
        tooltips: wNumb({ decimals: 1, edit: (v) => v < 0.5 ? 'Off' : `${(v >= 120) ? (v/60) : v}`.split('.')[0] })
      },
      this.changeAutoOnDelay.bind(this)
    )
  }

  render () {
    const c = QubinoZmnhad1SettingPanel.configurations
    const { animationLevel, theme, productObjectProxy, nodeId } = this.props
    const { panelReady, switchStates, meterLastValueKwh, meterLastValueW } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m7 l7'>Flush 1 Relay settings</h4>
          <Button className={cx('col s12 m3 l2 fluid', theme.actions.secondary)} waves={waves}
            onClick={this.invertBinarySwitchState.bind(this, 1)}>Turn {switchStates[0] ? 'OFF' : 'ON'}</Button>
          <div className='col s12 m9 l5'>Module #{nodeId} switch actually "{switchStates[0] ? 'ON' : 'OFF'}".</div>

          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <h5>Power & Energy consumption</h5>
        <Row className='section card form'>
          <Button className={cx('col s12 m6 l4 fluid', theme.actions.inconspicuous)} waves={waves}
            onClick={() => { this.props.productObjectProxy.meterResetCounter() }}>Reset energy meter</Button>
          <div className='col s12 m6 l8'>
            Actually {meterLastValueKwh || '--'} kWh / {meterLastValueW || '--'} W.
          </div>
        </Row>

        <h5>Configuration</h5>
        <Row className='section card form'>
          {this.renderListConfigurationAsSelect(
            c.INPUT_1_SWITCH_TYPE,
            ['Mono-stable switch type (push button)', 'Bi-stable switch'],
            { s: 12, m: 12, l: 12, label: 'Input 1 switch type' }
          )}
          {this.renderListConfigurationAsSelect(
            c.INPUT_2_CONTACT_TYPE,
            ['NO (normaly open) input type', 'NC (normaly close) input type'],
            { s: 12, m: 12, l: 12, label: 'Input 2 contact type' }
          )}
          {this.renderListConfigurationAsSelect(
            c.INPUT_3_CONTACT_TYPE,
            ['NO (normaly opened) input type', 'NC (normaly close) input type'],
            { s: 12, m: 12, l: 12, label: 'Input 3 contact type' }
          )}
          {this.renderListConfigurationAsSelect(
            c.ALL_ON_ALL_OFF,
            { 0: 'ALL ON is not active ALL OFF is not active',
              1: 'ALL ON is not active ALL OFF active',
              2: 'ALL ON active ALL OFF is not active',
              255: 'ALL ON active, ALL OFF active' },
            { s: 12, m: 12, l: 12, label: 'Activate / deactivate functions ALL ON/ALL OFF' }
          )}
          {this.renderListConfigurationAsSelect(
            c.RESET_DEVICE_STATUS_AFTER_A_POWER_FAILURE,
            [
              'Flush 1 relay module saves its state before power failure (it returns to the last position saved before a power failure)',
              'Flush 1 relay module does not save the state after a power failure, it returns to off position.'
            ],
            { s: 12, m: 12, l: 12, label: 'Saving the state of the relay after a power failure' }
          )}
          {this.renderListConfigurationAsSelect(
            c.AUTO_OFF_ON_SCALE,
            ['seconds', 'milliseconds'],
            { s: 12, m: 12, l: 12, label: 'Automatic turning on/off seconds or milliseconds selection' }
          )}
          <br/>
          <div className='col s12'>
            Automatic turning off relay after set time (in XXX) TODO !0: s or ms, depending on setting 15 above
          </div>
          <div className='col s12 slider'>
            <div id={`auto-off-delay-slider-${nodeId}`} />
          </div>
          <br/><br/>
          <div className='col s12'>
            Automatic turning on relay after set time (in XXX) TODO !0: s or ms, depending on setting 15 above
          </div>
          <div className='col s12 slider'>
            <div id={`auto-on-delay-slider-${nodeId}`} />
          </div>
          <br/><br/>

          TODO !0: sliders: POWER_REPORTING_THRESHOLD, POWER_REPORTING_INTERVAL
        </Row>

        TODO !3: notif (overload)
      </div>
    ) : super.render()
  }

  changeAutoOffDelay(value) {
    const index = QubinoZmnhad1SettingPanel.configurations.AUTO_OFF_DELAY
    return this.changeConfiguration(index, value[0], parseInt)
  }

  changeAutoOnDelay(value) {
    const index = QubinoZmnhad1SettingPanel.configurations.AUTO_ON_DELAY
    return this.changeConfiguration(index, value[0], parseInt)
  }


}

QubinoZmnhad1SettingPanel.propTypes = {
  ...BaseSettingPanel.propTypes,
  reconfigureElement: PropTypes.func.isRequired
}

QubinoZmnhad1SettingPanel.configurations = {
  INPUT_1_SWITCH_TYPE: 1, // <Mono-stable switch type (push button)="0">  <Bi-stable switch type="1">
  INPUT_2_CONTACT_TYPE: 2, // <NO (normaly open) input type="0">  <NC (normaly close) input type="1">
  INPUT_3_CONTACT_TYPE: 3, // <NO (normaly open) input type="0">  <NC (normaly close) input type="1">
  ALL_ON_ALL_OFF: 10, // Activate / deactivate functions ALL ON/ALL OFF  <ALL ON active, ALL OFF active="255">  <ALL ON is not active ALL OFF is not active="0">  <ALL ON is not active ALL OFF active="1">  <ALL ON active ALL OFF is not active="2">
  AUTO_OFF_DELAY: 11, // Automatic turning off relay after set time    slider 0-32535    0 => Auto OFF disabled. 1 - 32535  => 1 second (0,01s) - 32535 seconds (325,35s). Auto OFF enabled with define time, step is 1s or 10ms according to parameter 15. Default value 0
  AUTO_ON_DELAY: 12, // Automatic turning on relay after set time      slider 0-32535    0 => Auto ON disabled. 1 - 32535  => 1 second (0,01s) - 32535 seconds (325,35s). Auto ON enabled with define time, step is 1s or 10ms according to parameter 15. Default value 0
  AUTO_OFF_ON_SCALE: 15, // Automatic turning on/off seconds or milliseconds selection  <seconds="0">  <milliseconds="1">
  RESET_DEVICE_STATUS_AFTER_A_POWER_FAILURE: 30, // Saving the state of the relay after a power failure   <Flush 1 relay module saves its state before power failure (it returns to the last position saved before a power failure)="0">  <Flush 1 relay module does not save the state after a power failure, it returns to off position.="1">
  POWER_REPORTING_THRESHOLD: 40, // Power reporting in Watts on power change     min="0"max="100" value="10"    Set value from 0 - 100 (0%- 100%). 0 = Reporting Disabled. 1 - 100 = 1% - 100% and reporting enabled. Power report is send (push) only when actual power in Watts in real time change for more than set percentage comparing to previous actual power in Watts, step is 1%. Default value 10%
  POWER_REPORTING_INTERVAL: 42 // Power reporting in Watts by time interval     min="0" max="32535" value="300"     Set value means time interval (0 - 32535) in seconds, when power report is send. 0 = Reporting Disabled. 1 - 32535 = 1 second - 32535 seconds and reporting enabled. Power report is send with time interval set by entered value. Default value 300 (power report in Watts is send each 300s)
}

export default QubinoZmnhad1SettingPanel
