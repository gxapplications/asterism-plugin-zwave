'use strict'

/* global $ */
import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Checkbox, Select, Row, Preloader } from 'react-materialize'

import { Scenarii } from 'asterism-plugin-library'

import NameLocation from './name-location'

const { StatesDropdown } = Scenarii

const _displayMinutes = (seconds) => {
  if (seconds == 0) { // no eqeqeq here !
    return 'OFF'
  }
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  if (seconds < 3600) {
    const s = Math.round(seconds % 60)
    return s ? `${Math.floor(seconds / 60)}m${s}s` : `${Math.round(seconds / 60)}m`
  }
  const m = Math.round(seconds % 3600) / 60
  return m ? `${Math.floor(seconds / 3600)}h${m}m` : `${Math.round(seconds / 3600)}h`
}

class FibaroFgdw002SettingPanel extends React.Component {
  constructor (props) {
    super(props)

    const configs = FibaroFgdw002SettingPanel.configurations
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      batteryPercent: 0,
      batteryIcon: null,
      temperatureValue: 'N/A',
      temperatureUnit: '',
      isHeatAlarm: 'Unknown',
      isAccessControlAlarm: 'Unknown',
      isBurglarAlarm: 'Unknown',
      panelReady: false,
      configuration: {
        [configs.NORMAL_STATE]: null,
        [configs.LED_BEHAVIOR]: null,
        [configs.TEMPERATURE_MEASURE_INTERVAL]: null,
        [configs.TEMPERATURE_REPORTS_THRESHOLD]: null,
        [configs.TEMPERATURE_FORCED_REPORTS_INTERVAL]: null,
        [configs.TEMPERATURE_OFFSET]: null,
        [configs.TEMPERATURE_ALARM_REPORTS]: null,
        [configs.TEMPERATURE_ALARM_THRESHOLD_HIGH]: null,
        [configs.TEMPERATURE_ALARM_THRESHOLD_LOW]: null
      },
      stateId: null,
      stateBehavior: 1,
      forceBitmaskStatePosition: true
    }

    this._socket = props.privateSocket
    this._mounted = false
  }

  componentDidMount () {
    const configs = FibaroFgdw002SettingPanel.configurations
    this._mounted = true

    this._socket.on('node-event-configuration-updated', (nodeId, confIndex, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }

      if (this._mounted) {
        if (this.state.configuration[confIndex] !== value) {
          this.setState({
            configuration: { ...this.state.configuration, [confIndex]: value }
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
      o.sensorMultiLevelGetValue ? o.sensorMultiLevelGetValue() : 'N/A',
      o.sensorMultiLevelGetUnits ? o.sensorMultiLevelGetUnits() : '',
      o.isHeatAlarmOn ? o.isHeatAlarmOn() : 'Unknown',
      o.isAccessControlAlarmOn ? o.isAccessControlAlarmOn() : 'Unknown',
      o.isBurglarAlarmOn ? o.isBurglarAlarmOn() : 'Unknown',
      o.getConfiguration(configs.NORMAL_STATE),
      o.getConfiguration(configs.LED_BEHAVIOR),
      o.getConfiguration(configs.TEMPERATURE_MEASURE_INTERVAL),
      o.getConfiguration(configs.TEMPERATURE_REPORTS_THRESHOLD),
      o.getConfiguration(configs.TEMPERATURE_FORCED_REPORTS_INTERVAL),
      o.getConfiguration(configs.TEMPERATURE_OFFSET),
      o.getConfiguration(configs.TEMPERATURE_ALARM_REPORTS),
      o.getConfiguration(configs.TEMPERATURE_ALARM_THRESHOLD_HIGH),
      o.getConfiguration(configs.TEMPERATURE_ALARM_THRESHOLD_LOW),
      o.getStateId(),
      o.getStateBehavior(),
      o.getForceBitmaskStatePosition()
    ])
    .then(([batteryPercent, batteryIcon, temperatureValue, temperatureUnit, isHeatAlarm, isAccessControlAlarm, isBurglarAlarm,
        normalState, ledBehavior, tempMeasureInterval, tempReportsThreshold, tempForcedReportsInterval, tempOffset,
        tempAlarmReports, tempAlarmThresholdHigh, tempAlarmThresholdLow, stateId, stateBehavior, forceBitmaskStatePosition]) => {
      this.setState({
        batteryPercent: (batteryPercent === 'N/A') ? 'N/A' : Math.round(batteryPercent),
        batteryIcon,
        panelReady: true,
        temperatureValue,
        temperatureUnit,
        isHeatAlarm,
        isAccessControlAlarm,
        isBurglarAlarm,
        configuration: {
          [configs.NORMAL_STATE]: normalState,
          [configs.LED_BEHAVIOR]: ledBehavior,
          [configs.TEMPERATURE_MEASURE_INTERVAL]: tempMeasureInterval,
          [configs.TEMPERATURE_REPORTS_THRESHOLD]: tempReportsThreshold,
          [configs.TEMPERATURE_FORCED_REPORTS_INTERVAL]: tempForcedReportsInterval,
          [configs.TEMPERATURE_OFFSET]: tempOffset,
          [configs.TEMPERATURE_ALARM_REPORTS]: tempAlarmReports,
          [configs.TEMPERATURE_ALARM_THRESHOLD_HIGH]: tempAlarmThresholdHigh,
          [configs.TEMPERATURE_ALARM_THRESHOLD_LOW]: tempAlarmThresholdLow
        },
        stateId,
        stateBehavior,
        forceBitmaskStatePosition
      })

      this.plugWidgets()
    })
    .catch(console.error)
  }

  componentDidUpdate (prevProps, prevState) {
    this.plugWidgets()
  }

  componentWillUnmount () {
    this._mounted = false
  }

  plugWidgets () {
    const config = this.state.configuration
    const configs = FibaroFgdw002SettingPanel.configurations

    const domSlider1 = $(`#temperature-measure-interval-slider-${this.props.nodeId}`)[0]
    if (domSlider1) {
      if (!this._slider1 || !domSlider1.noUiSlider) {
        this._slider1 = noUiSlider.create(domSlider1, {
          start: (config[configs.TEMPERATURE_MEASURE_INTERVAL]) || 300,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 30],
            '9%': [60, 60],
            '26%': [300, 300],
            '48%': [1800, 600],
            '64%': [3600, 3600],
            'max': [32400]
          },
          format: wNumb({  decimals: 1, edit: (v) => `${v}`.split('.')[0] }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            stepped: true,
            density: 4,
            format: wNumb({  decimals: 1, edit: _displayMinutes })
          },
          tooltips: wNumb({ decimals: 1, edit: _displayMinutes }),
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider1.on('change', this.changeTemperatureMeasureInterval.bind(this))
      } else {
        this._slider1.set((config[configs.TEMPERATURE_MEASURE_INTERVAL]) || 300)
      }
    }

    const domSlider2 = $(`#temperature-reports-threshold-slider-${this.props.nodeId}`)[0]
    if (domSlider2) {
      if (!this._slider2 || !domSlider2.noUiSlider) {
        this._slider2 = noUiSlider.create(domSlider2, {
          start: (config[configs.TEMPERATURE_REPORTS_THRESHOLD]) || 10,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 4],
            '5%': [4, 2],
            '20%': [10, 5],
            '54%': [50, 10],
            '73%': [100, 20],
            '95%': [200, 100],
            'max': [300]
          },
          format: wNumb({
            decimals: 1, edit: (v) => `${v}`.split('.')[0]
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            stepped: true,
            density: 4,
            format: wNumb({
              decimals: 1, edit: (v) => (v === '0.0') ? 'OFF' : v / 10
            }),
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => (v === '0.0') ? 'OFF' : v / 10 }),
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider2.on('change', this.changeTemperatureReportsThreshold.bind(this))
      } else {
        this._slider2.set((config[configs.TEMPERATURE_REPORTS_THRESHOLD]) || 10)
      }
    }

    const domSlider3 = $(`#temperature-forced-reports-interval-slider-${this.props.nodeId}`)[0]
    if (domSlider3) {
      if (!this._slider3 || !domSlider3.noUiSlider) {
        this._slider3 = noUiSlider.create(domSlider3, {
          start: (config[configs.TEMPERATURE_FORCED_REPORTS_INTERVAL]) || 0,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 1200],
            '7%': [1200, 600],
            '28%': [3600, 1800],
            'max': [32400]
          },
          format: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            stepped: true,
            density: 5,
            format: wNumb({ decimals: 1, edit: _displayMinutes })
          },
          tooltips: wNumb({ decimals: 1, edit: _displayMinutes }),
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider3.on('change', this.changeTemperatureForcedReportsInterval.bind(this))
      } else {
        this._slider3.set((config[configs.TEMPERATURE_FORCED_REPORTS_INTERVAL]) || 0)
      }
    }

    const domSlider4 = $(`#temperature-offset-slider-${this.props.nodeId}`)[0]
    if (domSlider4) {
      if (!this._slider4 || !domSlider4.noUiSlider) {
        this._slider4 = noUiSlider.create(domSlider4, {
          start: (config[configs.TEMPERATURE_OFFSET]) || 0,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min':  [-300, 50],
            '10%': [-100, 5],
            '31%': [-30, 2],
            '50%': [0, 2],
            '69%': [30, 5],
            '90%': [100, 50],
            'max': [300]
          },
          format: wNumb({
            decimals: 1, edit: (v) => `${v}`.split('.')[0]
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            stepped: true,
            density: 2,
            filter: (v) => {
              if (Math.abs(v) > 300) {
                if (parseInt(v / 1000) === (v / 1000)) {
                  return 1;
                }
                return 0;
              }
              if (Math.abs(v) > 100) {
                if (parseInt(v / 100) === (v / 100)) {
                  return 1;
                }
                return 0;
              }
              if (Math.abs(v) > 30) {
                if (parseInt(v / 100) === (v / 100)) {
                  return 1;
                }
                if (parseInt(v / 10) === (v / 10)) {
                  return 2;
                }
                return 0;
              }
              if (parseInt(v / 10) === (v / 10)) {
                return 1;
              }
              return 0;
            },
            format: wNumb({ decimals: 1, edit: (v) => v / 10 })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => v / 10 }),
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider4.on('change', this.changeTemperatureOffset.bind(this))
      } else {
        this._slider4.set((config[configs.TEMPERATURE_OFFSET]) || 0)
      }
    }

    const domSlider5 = $(`#temperature-alarm-thresholds-${this.props.nodeId}`)[0]
    if (domSlider5) {
      if (!this._slider5 || !domSlider5.noUiSlider) {
        this._slider5 = noUiSlider.create(domSlider5, {
          start: [(config[configs.TEMPERATURE_ALARM_THRESHOLD_LOW]) || 100, (config[configs.TEMPERATURE_ALARM_THRESHOLD_HIGH]) || 350],
          connect: false,
          //margin: 10, // too buggy
          step: 1,
          animate: true,
          range: {
            'min': [0, 20],
            '12%': [80, 10],
            '86%': [400, 50],
            'max': [600]
          },
          format: wNumb({
                decimals: 1, edit: (v) => `${v}`.split('.')[0]
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            stepped: true,
            density: 4,
            format: wNumb({ decimals: 1, edit: (v) => v / 10 })
          },
          tooltips: [
            wNumb({ decimals: 1, edit: (v) => v / 10 }),
            wNumb({ decimals: 1, edit: (v) => v / 10 })
          ],
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider5.on('change', this.changeTemperatureAlarmThresholds.bind(this))
      } else {
        this._slider5.set([(config[configs.TEMPERATURE_ALARM_THRESHOLD_LOW]) || 100, (config[configs.TEMPERATURE_ALARM_THRESHOLD_HIGH]) || 350])
      }
    }
  }

  render () {
    const { nodeId, animationLevel, theme, services, productObjectProxy } = this.props
    const { batteryPercent, batteryIcon, temperatureValue, temperatureUnit, panelReady, configuration,
        isHeatAlarm, isAccessControlAlarm, isBurglarAlarm, stateId, stateBehavior, forceBitmaskStatePosition } = this.state
    const configs = FibaroFgdw002SettingPanel.configurations

    const normalState = configuration[configs.NORMAL_STATE] === 0 || configuration[configs.NORMAL_STATE] === 'Closed' || configuration[configs.NORMAL_STATE] === 'Door/Window Closed'
    let ledBehavior = configuration[configs.LED_BEHAVIOR]
    ledBehavior = [ledBehavior % 2 !== 0, [2, 3, 6, 7].includes(ledBehavior), [4, 5, 6, 7].includes(ledBehavior)]
    const tempMeasureInterval = configuration[configs.TEMPERATURE_MEASURE_INTERVAL]
    const tempReportsThreshold = configuration[configs.TEMPERATURE_REPORTS_THRESHOLD]
    const tempForcedReportsInterval = configuration[configs.TEMPERATURE_FORCED_REPORTS_INTERVAL]
    const tempOffset = configuration[configs.TEMPERATURE_OFFSET]

    let tempAlarmReports = configuration[configs.TEMPERATURE_ALARM_REPORTS]
    tempAlarmReports = ((tempAlarmReports === 'Disabled') ? 0 : tempAlarmReports)
    tempAlarmReports = ((tempAlarmReports === 'High temperature') ? 1 : tempAlarmReports)
    tempAlarmReports = ((tempAlarmReports === 'Low temperature') ? 2 : tempAlarmReports)
    tempAlarmReports = ((tempAlarmReports === 'High and low temperature') ? 3 : tempAlarmReports)
    tempAlarmReports = [tempAlarmReports %2 !== 0, tempAlarmReports >= 2]
    const tempAlarmThresholdHigh = configuration[configs.TEMPERATURE_ALARM_THRESHOLD_HIGH]
    const tempAlarmThresholdLow = configuration[configs.TEMPERATURE_ALARM_THRESHOLD_LOW]

    let alarming = (normalState && isAccessControlAlarm) ? 'Opened alarm' : ((!normalState && isAccessControlAlarm) ? 'Closed alarm' : (normalState ? 'Normally closed' : 'Normally opened'))
    alarming = (isBurglarAlarm === true) ? 'Burglar alarm' : ((isHeatAlarm === true) ? 'Heat alarm' : ((isAccessControlAlarm === 'Unknown') ? 'Unknown' : alarming))

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m12 l5'>Door Opening Sensor settings</h4>
          <div className='col s12 m9 l5'>Sensor #{nodeId} state actually "{alarming}"; Temperature {temperatureValue}{temperatureUnit}.</div>
          <div className='right'>
            <i className={cx('material-icons', batteryIcon)}>{batteryIcon}</i>&nbsp;{batteryPercent}%
          </div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>
        <hr />

        <h5>Normal state</h5>
        <Row className='section card form'>
          <div className='col s12 m5 l3'>
            <div className='switch'>
              <label>
                Closed
                <input type='checkbox' name='normal-state' value='normal-state' checked={!normalState}
                  onChange={() => { this.changeNormalState(normalState) }} />
                <span className='lever'></span>
                Opened
              </label>
            </div>
          </div>
          <div className='col s12 m7 l9'>
            "Normal state" feature (Normally Closed means will trigger alarm when Opened).
          </div>
        </Row>
        <hr />

        <h5>Link to a scenarii bitmask state</h5>
        <Row className='section card form'>
          <div className='col s12 m6'>
            <StatesDropdown defaultStateId={stateId} onChange={this.stateIdChange.bind(this)}
              theme={theme} animationLevel={animationLevel} services={services}
              typeFilter={(e) => e.id === 'bitmask-state'} instanceFilter={(e) => e.typeId === 'bitmask-state'}>
              <option key='no-state-option' value={''}>No link</option>
            </StatesDropdown>
          </div>

          {stateId && stateId.length > 0 && [
            <Select key={0} s={12} m={6} label='Choose bitmask state position behavior'
              onChange={this.stateBehaviorChange.bind(this)} value={`${stateBehavior}`}>
              <option value='1'>Set state position 1 (to 1) when opened</option>
              <option value='-1'>Set state position 1 (to 1) when closed</option>
              <option value='2'>Set state position 2 (to 1) when opened</option>
              <option value='-2'>Set state position 2 (to 1) when closed</option>
              <option value='4'>Set state position 3 (to 1) when opened</option>
              <option value='-4'>Set state position 3 (to 1) when closed</option>
              <option value='8'>Set state position 4 (to 1) when opened</option>
              <option value='-8'>Set state position 4 (to 1) when closed</option>
              <option value='16'>Set state position 5 (to 1) when opened</option>
              <option value='-16'>Set state position 5 (to 1) when closed</option>
              <option value='32'>Set state position 6 (to 1) when opened</option>
              <option value='-32'>Set state position 6 (to 1) when closed</option>
              <option value='64'>Set state position 7 (to 1) when opened</option>
              <option value='-64'>Set state position 7 (to 1) when closed</option>
              <option value='128'>Set state position 8 (to 1) when opened</option>
              <option value='-128'>Set state position 8 (to 1) when closed</option>
            </Select>,
            <div key={1} className='col s12'>
                <div className='switch'>
                  <label>
                    <input type='checkbox' name='force-bitmask-state-position' value='force-bitmask-state-position' checked={forceBitmaskStatePosition}
                      onChange={() => { this.changeForceBitmaskStatePosition(!forceBitmaskStatePosition) }} />
                    <span className='lever'></span>
                    Force control on the state position (other actions to change it will fail)
                  </label>
                </div>
            </div>
          ]}
        </Row>
        <hr />

        <h5>Advanced</h5>
        <div className='section card form'>
          <Row>
            <div className='col s12 m6 l3'>
               Led behavior:
            </div>
            <div className='col s12 m6 l3'>
              <Checkbox className='filled-in' value='1' label='On opening/closing status change'
                onChange={() => { this.changeLedBehavior(1, 0, !ledBehavior[0]) }} checked={ledBehavior[0]} />
            </div>
            <div className='col s12 m6 l3'>
              <Checkbox className='filled-in' value='2' label='On wake up (1 x click or periodical)'
                onChange={() => { this.changeLedBehavior(2, 1, !ledBehavior[1]) }} checked={ledBehavior[1]} />
            </div>
            <div className='col s12 m6 l3'>
              <Checkbox className='filled-in' value='4' label='On device tampering'
                onChange={() => { this.changeLedBehavior(4, 2, !ledBehavior[2]) }} checked={ledBehavior[2]} />
            </div>
          </Row>

          <Row>
            <div className='col s12'>
              Temperature measurement interval: {_displayMinutes(tempMeasureInterval)}&nbsp;
              {(tempMeasureInterval < 60 && '(Warning: setting under 1 minute will drastically reduce battery lifetime!)') || tempMeasureInterval < 300 && '(Setting under 5 minutes will affect battery lifetime)'}
              .
            </div>
            <div className='col s12 slider'>
                <div id={`temperature-measure-interval-slider-${nodeId}`} />
            </div>
          </Row>

          <Row>
            <div className='col s12'>
              Temperature reports threshold: {tempReportsThreshold / 10}°C&nbsp;
              {tempReportsThreshold < 10 && '(Warning: setting under 1°C will affect battery lifetime!)'}
              .
            </div>
            <div className='col s12 slider'>
              <div id={`temperature-reports-threshold-slider-${nodeId}`} />
            </div>
          </Row>

          <Row>
            <div className='col s12'>
              Temperature forced reports interval: {tempForcedReportsInterval > 0 && _displayMinutes(tempForcedReportsInterval) || 'deactivated'}&nbsp;
              {tempForcedReportsInterval < 3600 && '(Setting under 1 hour will affect battery lifetime)'}
              .
            </div>
            <div className='col s12 slider'>
                <div id={`temperature-forced-reports-interval-slider-${nodeId}`} />
            </div>
          </Row>

          <Row>
            <div className='col s12'>Temperature offset: {tempOffset / 10}°C.</div>
            <div className='col s12 slider'>
                <div id={`temperature-offset-slider-${nodeId}`} />
            </div>
          </Row>

          <Row>
            <div className='col s12 m6 l3'>
              Temperature alarm reports:
            </div>
            <div className='col s12 m6 l3'>
              <Checkbox className='filled-in' value='1' label='High temperature alarm'
                onChange={() => { this.changeTempAlarmReports(1, 0, !tempAlarmReports[0]) }} checked={tempAlarmReports[0]} />
            </div>
            <div className='col s12 m6 l3'>
              <Checkbox className='filled-in' value='2' label='Low temperature alarm'
                onChange={() => { this.changeTempAlarmReports(2, 1, !tempAlarmReports[1]) }} checked={tempAlarmReports[1]} />
            </div>
          </Row>

          <Row>
            <div className='col s12'>Temperature alarm thresholds: {tempAlarmThresholdHigh / 10}°C & {tempAlarmThresholdLow / 10}°C.</div>
            <div className='col s12 slider'>
                <div id={`temperature-alarm-thresholds-${nodeId}`} />
            </div>
          </Row>

          <Row>
            <div className='col s12'>Link temperature to floating state</div>
            <div className='col s12 m6'>
              // TODO !0
              <!--StatesDropdown defaultStateId={stateId} onChange={this.stateIdChange.bind(this)}
                              theme={theme} animationLevel={animationLevel} services={services}
                              typeFilter={(e) => e.id === 'bitmask-state'} instanceFilter={(e) => e.typeId === 'bitmask-state'}>
                <option key='no-state-option' value={''}>No link</option>
              </StatesDropdown-->
            </div>
          </Row>
          <br />
          <Row>
            <h5>Notice: Settings update</h5>
            After you change any settings, you must wakeup the sensor to update its configuration. To do that, remove the
            sensor's cover and double click on the side switch, then put back the cover.
          </Row>
        </div>

        <Row className='section card form'>
          <h5>How to use this sensor</h5>
          An alarm signal is triggered when sensor detects door opening or closing.
          To catch these actions, you need to create an <b>Alarm Trigger/Condition</b> from
          the Scenarii panel (Triggers/Conditions tab), then use the "learn" feature and open/close the door.
          You can also link the door state to a Scenarii Level State element, above.

          <h5>How to use the temperature meter</h5>
          You need to create a <b>Temperature Trigger/Condition</b> from
          the Scenarii panel (Triggers/Conditions tab), then select this sensor in the list.
        </Row>
      </div>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }

  changeNormalState (value) {
    this.props.productObjectProxy.setConfiguration(FibaroFgdw002SettingPanel.configurations.NORMAL_STATE, value ? 1 : 0)
    .then(() => {
      this.setState({
          configuration: { ...this.state.configuration, [FibaroFgdw002SettingPanel.configurations.NORMAL_STATE]: value ? 1 : 0 }
      })
    })
    .catch(console.error)
  }

  changeLedBehavior (value, index, add) {
    let ledBehavior = this.state.configuration[FibaroFgdw002SettingPanel.configurations.LED_BEHAVIOR]
    ledBehavior = [ledBehavior % 2 !== 0, [2, 3, 6, 7].includes(ledBehavior), [4, 5, 6, 7].includes(ledBehavior)]

    ledBehavior[index] = add
    ledBehavior = (ledBehavior[0] ? 1 : 0) + (ledBehavior[1] ? 2 : 0) + (ledBehavior[2] ? 4 : 0)

    this.props.productObjectProxy.setConfiguration(FibaroFgdw002SettingPanel.configurations.LED_BEHAVIOR, ledBehavior)
    .then(() => {
      this.setState({
          configuration: { ...this.state.configuration, [FibaroFgdw002SettingPanel.configurations.LED_BEHAVIOR]: ledBehavior }
      })
    })
    .catch(console.error)
  }

  changeTempAlarmReports (value, index, add) {
    let tempAlarmReports = this.state.configuration[FibaroFgdw002SettingPanel.configurations.TEMPERATURE_ALARM_REPORTS]
    tempAlarmReports = ((tempAlarmReports === 'Disabled') ? 0 : tempAlarmReports)
    tempAlarmReports = [tempAlarmReports %2 !== 0, tempAlarmReports >= 2]

    tempAlarmReports[index] = add
    tempAlarmReports = (tempAlarmReports[0] ? 1 : 0) + (tempAlarmReports[1] ? 2 : 0)

    this.props.productObjectProxy.setConfiguration(FibaroFgdw002SettingPanel.configurations.TEMPERATURE_ALARM_REPORTS, tempAlarmReports)
    .then(() => {
      this.setState({
          configuration: { ...this.state.configuration, [FibaroFgdw002SettingPanel.configurations.TEMPERATURE_ALARM_REPORTS]: tempAlarmReports }
      })
    })
    .catch(console.error)
  }

  changeTemperatureMeasureInterval (value) {
    this.props.productObjectProxy.setConfiguration(FibaroFgdw002SettingPanel.configurations.TEMPERATURE_MEASURE_INTERVAL, parseInt(value[0]))
    .then(() => {
      this.setState({
        configuration: { ...this.state.configuration, [FibaroFgdw002SettingPanel.configurations.TEMPERATURE_MEASURE_INTERVAL]: parseInt(value[0]) }
      })
    })
    .catch(console.error)
  }

  changeTemperatureReportsThreshold (value) {
    this.props.productObjectProxy.setConfiguration(FibaroFgdw002SettingPanel.configurations.TEMPERATURE_REPORTS_THRESHOLD, parseInt(value[0]))
    .then(() => {
      this.setState({
        configuration: { ...this.state.configuration, [FibaroFgdw002SettingPanel.configurations.TEMPERATURE_REPORTS_THRESHOLD]: parseInt(value[0]) }
      })
    })
    .catch(console.error)
  }

  changeTemperatureForcedReportsInterval (value) {
    this.props.productObjectProxy.setConfiguration(FibaroFgdw002SettingPanel.configurations.TEMPERATURE_FORCED_REPORTS_INTERVAL, parseInt(value[0]))
    .then(() => {
      this.setState({
        configuration: { ...this.state.configuration, [FibaroFgdw002SettingPanel.configurations.TEMPERATURE_FORCED_REPORTS_INTERVAL]: parseInt(value[0]) }
      })
    })
    .catch(console.error)
  }

  changeTemperatureOffset (value) {
    this.props.productObjectProxy.setConfiguration(FibaroFgdw002SettingPanel.configurations.TEMPERATURE_OFFSET, parseInt(value[0]))
    .then(() => {
      this.setState({
        configuration: { ...this.state.configuration, [FibaroFgdw002SettingPanel.configurations.TEMPERATURE_OFFSET]: parseInt(value[0]) }
      })
    })
    .catch(console.error)
  }

  changeTemperatureAlarmThresholds (value) {
    const low = parseInt(value[0])
    const high = parseInt(value[1])

    this.props.productObjectProxy.setConfiguration(FibaroFgdw002SettingPanel.configurations.TEMPERATURE_ALARM_THRESHOLD_LOW, low)
    .then(() => this.props.productObjectProxy.setConfiguration(FibaroFgdw002SettingPanel.configurations.TEMPERATURE_ALARM_THRESHOLD_HIGH, high))
    .then(() => {
      this.setState({
        configuration: {
          ...this.state.configuration,
          [FibaroFgdw002SettingPanel.configurations.TEMPERATURE_ALARM_THRESHOLD_LOW]: low,
          [FibaroFgdw002SettingPanel.configurations.TEMPERATURE_ALARM_THRESHOLD_HIGH]: high
        }
      })
    })
    .catch(console.error)
  }

  stateIdChange (value) {
    this.props.productObjectProxy.setStateId(value)
    .then(() => {
      this.setState({
        stateId: value
      })
    })
    .catch(console.error)
  }

  stateBehaviorChange (event) {
    const value = parseInt(event.currentTarget.value)
    this.props.productObjectProxy.setStateBehavior(value)
    .then(() => {
      this.setState({
          stateBehavior: value
        })
    })
    .catch(console.error)
  }

  changeForceBitmaskStatePosition (value) {
    this.props.productObjectProxy.setForceBitmaskStatePosition(value)
    .then(() => {
      this.setState({
        forceBitmaskStatePosition: value
      })
    })
    .catch(console.error)
  }
}

FibaroFgdw002SettingPanel.propTypes = {
  serverStorage: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  localStorage: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  privateSocket: PropTypes.object.isRequired,
  productObjectProxy: PropTypes.object.isRequired,
  nodeId: PropTypes.number.isRequired,
  reconfigureElement: PropTypes.func.isRequired
}

FibaroFgdw002SettingPanel.configurations = {
  NORMAL_STATE: 1,
  LED_BEHAVIOR: 2,
  TEMPERATURE_MEASURE_INTERVAL: 50,
  TEMPERATURE_REPORTS_THRESHOLD: 51,
  TEMPERATURE_FORCED_REPORTS_INTERVAL: 52,
  TEMPERATURE_OFFSET: 53,
  TEMPERATURE_ALARM_REPORTS: 54,
  TEMPERATURE_ALARM_THRESHOLD_HIGH: 55,
  TEMPERATURE_ALARM_THRESHOLD_LOW: 56
}

export default FibaroFgdw002SettingPanel
