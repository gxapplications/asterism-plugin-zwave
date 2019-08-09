'use strict'

/* global $, noUiSlider, wNumb */
import cx from 'classnames'
import debounce from 'debounce'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Row, Select, Preloader } from 'react-materialize'

import NameLocation from './name-location'

class FibaroFgrgbwm441SettingPanel extends React.Component {
  constructor (props) {
    super(props)

    const configs = FibaroFgrgbwm441SettingPanel.configurations
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      levels: {
        brightness: 0, red: 0, green: 0, blue: 0, white: 0
      },
      meterLastValue: null,
      energyLevel: null,
      costLastValue: null,
      configuration: {
        [configs.ENABLE_ALL_ON_OFF]: null,
        [configs.OUTPUTS_STATE_CHANGE_MODE]: null,
        [configs.DIMMING_STEP_VALUE_MODE_1]: null,
        [configs.TIME_BETWEEN_DIMMING_STEPS_MODE_1]: null,
        [configs.TIME_TO_COMPLETE_TRANSITION_MODE_2]: null,
        [configs.MAXIMUM_DIMMER_LEVEL]: null,
        [configs.MINIMUM_DIMMER_LEVEL]: null
      },
      panelReady: false
    }

    this._socket = props.privateSocket
    this._mounted = false

    this.debouncedDimmingStepValueMode1Value = debounce((value) => {
      this.changeConfiguration(configs.DIMMING_STEP_VALUE_MODE_1, value)
    }, 1200, false)
    this.debouncedTimeBetweenDimmingStepsMode1Value = debounce((value) => {
      this.changeConfiguration(configs.TIME_BETWEEN_DIMMING_STEPS_MODE_1, value)
    }, 1200, false)
  }

  componentDidMount () {
    const configs = FibaroFgrgbwm441SettingPanel.configurations
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
    this._socket.on('node-event-multi-level-switch-changed', (nodeId, value, instance, index) => {
      if (this.props.nodeId !== nodeId || index !== 0) {
        return
      }
      if (this._mounted) {
        const levels = this.state.levels
        switch (instance) {
          case 1:
          case 2:
            levels.brightness = value.value
            break
          case 3:
            levels.red = value.value
            break
          case 4:
            levels.green = value.value
            break
          case 5:
            levels.blue = value.value
            break
          case 6:
            levels.white = value.value
        }
        this.setState({ levels })
      }
    })
    this._socket.on('node-event-meter-changed', (nodeId, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }
      if (this._mounted) {
        // TODO !0: to test, seems to be broken
        if (this.state.meterLastValue !== value.value) {
          this.setState({
            meterLastValue: value.value
          })
          this.props.productObjectProxy.energyConsumptionMeterGetLastCost()
          .then(costLastValue => {
            if (this._mounted) {
              this.setState({ costLastValue })
            }
          })
        }
      }
    })
    this._socket.on('node-event-sensor-multi-level-changed', (nodeId, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }
      if (this._mounted) {
        // TODO !0: to test, seems to be broken
        if (this.state.energyLevel !== value.value) {
          this.setState({
            energyLevel: value.value
          })
        }
      }
    })

    const o = this.props.productObjectProxy
    Promise.all([
      o.multiLevelSwitchGetValue(2), // Main brightness
      o.multiLevelSwitchGetValue(3), // Red
      o.multiLevelSwitchGetValue(4), // Green
      o.multiLevelSwitchGetValue(5), // Blue
      o.multiLevelSwitchGetValue(6), // White
      o.meterGetLastValue(),
      o.sensorMultiLevelGetValue(),
      o.energyConsumptionMeterGetLastCost(),
      o.getConfiguration(configs.ENABLE_ALL_ON_OFF),
      o.getConfiguration(configs.OUTPUTS_STATE_CHANGE_MODE),
      o.getConfiguration(configs.DIMMING_STEP_VALUE_MODE_1),
      o.getConfiguration(configs.TIME_BETWEEN_DIMMING_STEPS_MODE_1),
      o.getConfiguration(configs.TIME_TO_COMPLETE_TRANSITION_MODE_2),
      o.getConfiguration(configs.MAXIMUM_DIMMER_LEVEL),
      o.getConfiguration(configs.MINIMUM_DIMMER_LEVEL),
    ])
    .then(([brightnessLevel, redLevel, greenLevel, blueLevel, whiteLevel,
      meterLastValue, energyLevel, costLastValue,
      enableAllOnOff, outputStateChangeMode, dimmingStepValueMode1, timeBetweenDimmingStepsMode1,
      timeToCompleteTransitionMode2, maxDimmerLevel, minDimmerLevel]) => {
      this.setState({
        levels: {
          brightness: brightnessLevel,
          red: redLevel,
          green: greenLevel,
          blue: blueLevel,
          white: whiteLevel
        },
        meterLastValue,
        energyLevel,
        costLastValue,
        configuration: {
          [configs.ENABLE_ALL_ON_OFF]: enableAllOnOff,
          [configs.OUTPUTS_STATE_CHANGE_MODE]: outputStateChangeMode,
          [configs.DIMMING_STEP_VALUE_MODE_1]: dimmingStepValueMode1,
          [configs.TIME_BETWEEN_DIMMING_STEPS_MODE_1]: timeBetweenDimmingStepsMode1,
          [configs.TIME_TO_COMPLETE_TRANSITION_MODE_2]: timeToCompleteTransitionMode2,
          [configs.MAXIMUM_DIMMER_LEVEL]: maxDimmerLevel,
          [configs.MINIMUM_DIMMER_LEVEL]: minDimmerLevel
        },
        panelReady: true
      })
      this.plugWidgets()
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }

  componentDidUpdate (prevProps, prevState) {
    this.plugWidgets()
  }

  plugWidgets () {
    const config = this.state.configuration
    const configs = FibaroFgrgbwm441SettingPanel.configurations

    const domSlider1 = $(`#dimming-step-value-slider-${this.props.nodeId}`)[0]
    if (domSlider1) {
      if (!this._slider1 || !domSlider1.noUiSlider) {
        this._slider1 = noUiSlider.create(domSlider1, {
          start: config[configs.DIMMING_STEP_VALUE_MODE_1] || 1,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [1],
            'max': [99]
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
            filter: (value) => {
                if (value === 1 || value === 99) {
                    return 1
                }
                return (value % 25 === 0) ? 1 : ((value % 5 === 0) ? 2 : 0)
            },
            format: wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] + '%' }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider1.on('change', this.changeDimmingStepValueMode1Value.bind(this))
      } else {
        this._slider1.set(config[configs.DIMMING_STEP_VALUE_MODE_1] || 1)
      }
    }

    const domSlider2 = $(`#time-between-steps-slider-${this.props.nodeId}`)[0]
    if (domSlider2) {
      if (!this._slider2 || !domSlider2.noUiSlider) {
        this._slider2 = noUiSlider.create(domSlider2, {
          start: config[configs.TIME_BETWEEN_DIMMING_STEPS_MODE_1] || 10,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 1],
            '9%': [5, 5],
            '12%': [10, 10],
            '23%': [50, 50],
            '27%': [100, 100],
            '56%': [1000, 1000],
            '68%': [5000, 5000],
            '89%': [30000, 10000],
            'max': [60000]
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            stepped: true,
            density: 3,
            format: wNumb({
              decimals: 1,
              edit: (v) => {
                return (v > 999) ? `${Math.round(v / 1000)}s` : `${v}`.split('.')[0]
              }
            })
          },
          tooltips: wNumb({
              decimals: 1,
              edit: (v) => {
                 return (v > 999) ? `${Math.round(v / 1000)}s` : `${v}`.split('.')[0]
              }
          }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider2.on('change', this.changeTimeBetweenDimmingStepsMode1Value.bind(this))
      } else {
        this._slider2.set(config[configs.TIME_BETWEEN_DIMMING_STEPS_MODE_1] || 10)
      }
    }

    // TODO !1: brightness, red, green, blue, white levels, use logarithmic scale
  }

  render () {
    const { nodeId, animationLevel, theme, services, productObjectProxy } = this.props
    const { levels, meterLastValue, energyLevel, costLastValue, configuration, panelReady } = this.state
    const configs = FibaroFgrgbwm441SettingPanel.configurations

console.log('TODO !0 : ######## semblent pas bons:', energyLevel, costLastValue)

    let enableAllOnOff = configuration[configs.ENABLE_ALL_ON_OFF]
    enableAllOnOff = enableAllOnOff === 'ALL ON disabled/ ALL OFF disabled' ? 0 : enableAllOnOff
    enableAllOnOff = enableAllOnOff === 'ALL ON disabled/ ALL OFF active' ? 1 : enableAllOnOff
    enableAllOnOff = enableAllOnOff === 'ALL ON active / ALL OFF disabled' ? 2 : enableAllOnOff
    enableAllOnOff = enableAllOnOff === 'ALL ON active / ALL OFF active' ? 3 : enableAllOnOff

    let outputsStateChangeMode = configuration[configs.OUTPUTS_STATE_CHANGE_MODE]
    outputsStateChangeMode = outputsStateChangeMode === 'MODE 1 - Constant Speed (speed is defined by parameters 9 and 10)' ? 0 : outputsStateChangeMode
    outputsStateChangeMode = outputsStateChangeMode === 'MODE 2 - Constant Time (RGB/RBGW only. Time is defined by parameter 11)' ? 1 : outputsStateChangeMode

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m7 l7'>RGBW settings</h4>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
            onClick={() => productObjectProxy.multiLevelSwitchSetValue(0, 2)}>OFF</Button>
          <div className='col s12 m8 l8'>TODO !0: energy as float ~  {energyLevel | '0.0'}W.</div>

          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>
        <hr />

        <div className='section card form'>
          TODO !1: levels in controls
          <div className='col s12'><br />Main brightness</div>
          <div className='col s12 slider'>
            <div id={`brightness-slider-${nodeId}`} />
          </div>
          <div className='col s12'><br />Red</div>
          <div className='col s12 slider'>
            <div id={`red-slider-${nodeId}`} />
          </div>
          <div className='col s12'><br />Green</div>
          <div className='col s12 slider'>
            <div id={`green-slider-${nodeId}`} />
          </div>
          <div className='col s12'><br />Blue</div>
          <div className='col s12 slider'>
            <div id={`blue-slider-${nodeId}`} />
          </div>
          <div className='col s12'><br />White</div>
          <div className='col s12 slider'>
            <div id={`white-slider-${nodeId}`} />
          </div>
        </div>

        <h5>Transitions and controls</h5>
        <div className='section card form'>
          <Row>
            <Select s={12} label='Network Switch ALL (ON / OFF feature)'
              onChange={this.changeConfiguration.bind(this, configs.ENABLE_ALL_ON_OFF)} value={`${enableAllOnOff}`}>
              <option value='0'>ALL ON disabled, ALL OFF disabled</option>
              <option value='1'>ALL ON disabled, ALL OFF active</option>
              <option value='2'>ALL ON active, ALL OFF disabled</option>
              <option value='3'>ALL ON active, ALL OFF active</option>
            </Select>

            <Select s={12} label='Behaviour of transitions between levels'
              onChange={this.changeConfiguration.bind(this, configs.OUTPUTS_STATE_CHANGE_MODE)} value={`${outputsStateChangeMode}`}>
              <option value='0'>MODE 1 - Constant Speed</option>
              <option value='1'>MODE 2 - Constant Time (RGB/RBGW only)</option>
            </Select>

            {outputsStateChangeMode === 0 && (
              <div>
                <br />
                <div className='col s12'><br />Dimming step value: actually {configuration[configs.DIMMING_STEP_VALUE_MODE_1]}%.</div>
                <div className='col s12 slider'>
                  <div id={`dimming-step-value-slider-${nodeId}`} />
                </div>
                <div className='col s12'><br />Time between dimming steps: actually {configuration[configs.TIME_BETWEEN_DIMMING_STEPS_MODE_1]}ms.</div>
                <div className='col s12 slider'>
                  <div id={`time-between-steps-slider-${nodeId}`} />
                </div>
              </div>
            )}

            {outputsStateChangeMode === 1 && (
              <div>
                TODO !2
                <div className='col s12'><br />Time to complete transition: actually {configuration[configs.TIME_TO_COMPLETE_TRANSITION_MODE_2]}??.</div>
                <div className='col s12 slider'>
                  <div id={`time-to-complete-transition-slider-${nodeId}`} />
                </div>
              </div>
            )}
          </Row>
        </div>



          <Row>
              TODO !1: controls :
              - levels, knob 0-99% for each channel (x4), with a listener to update it.
              - On/Off All at once (if setting is activated)
              - meter counter with reset button, and {meterLastValue.v}, {costLastValue}
              <br />
              TODO !2: configs :
              configuration[configs.TIME_TO_COMPLETE_TRANSITION_MODE_2] knob, from XX to XX, only if Mode 2 selected,
              0 – immediate change
              1-63 – 20-126ms – value*20ms
              65-127 – 1-63s – [value-64]*1s
              129-191 – 10-630s – [value-128]*10s
              193-255 – 1-63min – [value-192]*1min
              Default setting: 67 (3s)œ
              configuration[configs.MINIMUM_DIMMER_LEVEL] - configuration[configs.MAXIMUM_DIMMER_LEVEL]: 2 knobs on 1 rail.
              <br />
          </Row>

        TODO !2: to remove:
        <br />
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(0, 2) }}>0</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(1, 2) }}>1</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(2, 2) }}>2</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(15, 2) }}>15</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(50, 2) }}>50</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(99, 2) }}>99</button>
        <br />
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(0, 3) }}>R 0</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(1, 3) }}>R 1</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(2, 3) }}>R 2</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(15, 3) }}>R 15</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(50, 3) }}>R 50</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(99, 3) }}>R 99</button>
        <br />
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(0, 4) }}>G 0</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(1, 4) }}>G 1</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(2, 4) }}>G 2</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(15, 4) }}>G 15</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(50, 4) }}>G 50</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(99, 4) }}>G 99</button>
        <br />
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(0, 5) }}>B 0</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(1, 5) }}>B 1</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(2, 5) }}>B 2</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(15, 5) }}>B 15</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(50, 5) }}>B 50</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(99, 5) }}>B 99</button>
        <br />
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(0, 6) }}>W 0</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(1, 6) }}>W 1</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(2, 6) }}>W 2</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(15, 6) }}>W 15</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(50, 6) }}>W 50</button>
        <button onClick={() => { this.props.productObjectProxy.multiLevelSwitchSetValue(99, 6) }}>W 99</button>
      </div>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }

  changeConfiguration (confIndex, event) {
    this.setState({
      configuration: { ...this.state.configuration, [confIndex]: event.currentTarget.value }
    })
    this.props.productObjectProxy.setConfiguration(confIndex, event.currentTarget.value)
    .catch(console.error)
  }

  changeDimmingStepValueMode1Value (value) {
    this.setState({
      configuration: { ...this.state.configuration, [FibaroFgrgbwm441SettingPanel.configurations.DIMMING_STEP_VALUE_MODE_1]: value }
    })
    this.debouncedDimmingStepValueMode1Value(value)
  }

  changeTimeBetweenDimmingStepsMode1Value (value) {
    this.setState({
      configuration: { ...this.state.configuration, [FibaroFgrgbwm441SettingPanel.configurations.TIME_BETWEEN_DIMMING_STEPS_MODE_1]: value }
    })
    this.debouncedTimeBetweenDimmingStepsMode1Value(value)
  }
}

FibaroFgrgbwm441SettingPanel.propTypes = {
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

FibaroFgrgbwm441SettingPanel.configurations = {
  ENABLE_ALL_ON_OFF: 1,
  OUTPUTS_STATE_CHANGE_MODE: 8,
  DIMMING_STEP_VALUE_MODE_1: 9,
  TIME_BETWEEN_DIMMING_STEPS_MODE_1: 10,
  TIME_TO_COMPLETE_TRANSITION_MODE_2: 11,
  MAXIMUM_DIMMER_LEVEL: 12,
  MINIMUM_DIMMER_LEVEL: 13
}

export default FibaroFgrgbwm441SettingPanel
