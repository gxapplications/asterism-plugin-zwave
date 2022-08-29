'use strict'

/* global $, noUiSlider, wNumb */
import cx from 'classnames'
import debounce from 'debounce'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Row, Select, Preloader } from 'react-materialize'

import { Scenarii } from 'asterism-plugin-library'

import NameLocation from './name-location'

const { StatesDropdown } = Scenarii

const mode2SliderEdit = (v) => {
  v = Math.round(v)
  if (v === 0) return '0'
  if (v <= 49) {
    return `${v * 20}ms`
  }
  if (v <= 123) {
    return `${v - 64}s`
  }
  return `${v - 192}m`
}

// TODO !1: refacto with BaseSettingPanel
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
      panelReady: false,
      colorLevelStateId: null,
      brightnessLevelState: -1,
      autoDimmAmount: -1,
      autoDimmTime: 5 * 60 * 1000 // 5 mins
    }

    this._socket = props.privateSocket
    this._mounted = false

    this.debouncedDimmingStepValueMode1Value = debounce((value) => {
      this.changeConfiguration(configs.DIMMING_STEP_VALUE_MODE_1, value)
    }, 1200, false)
    this.debouncedTimeBetweenDimmingStepsMode1Value = debounce((value) => {
      this.changeConfiguration(configs.TIME_BETWEEN_DIMMING_STEPS_MODE_1, value)
    }, 1200, false)
    this.debouncedTimeToCompleteTransitionMode2Value = debounce((value) => {
      this.changeConfiguration(configs.TIME_TO_COMPLETE_TRANSITION_MODE_2, value)
    }, 1200, false)
    this.debouncedMinMaxDimmerLevel = debounce((min, max) => {
      this.changeConfiguration(configs.MINIMUM_DIMMER_LEVEL, min)
      this.changeConfiguration(configs.MAXIMUM_DIMMER_LEVEL, max)
    }, 1200, false)
    this.debouncedAutoDimmTimeValueValue = debounce((value) => {
      this.props.productObjectProxy.setAutoDimmTime(value)
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
      o.getColorLevelStateId(),
      o.getBrightnessLevelState(),
      o.getAutoDimmAmount(),
      o.getAutoDimmTime()
    ])
    .then(([brightnessLevel, redLevel, greenLevel, blueLevel, whiteLevel,
      meterLastValue, energyLevel, costLastValue,
      enableAllOnOff, outputStateChangeMode, dimmingStepValueMode1, timeBetweenDimmingStepsMode1,
      timeToCompleteTransitionMode2, maxDimmerLevel, minDimmerLevel, colorLevelStateId, brightnessLevelState,
      autoDimmAmount, autoDimmTime]) => {
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
        panelReady: true,
        colorLevelStateId,
        brightnessLevelState,
        autoDimmAmount,
        autoDimmTime
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
    const levels = this.state.levels
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

    const domSlider3 = $(`#brightness-slider-${this.props.nodeId}`)[0]
    if (domSlider3) {
      if (!this._slider3 || !domSlider3.noUiSlider) {
        this._slider3 = noUiSlider.create(domSlider3, {
          start: levels.brightness || 0,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 1],
            '50%': [15, 5],
            '80%': [50, 10],
            '96%': [90, 9],
            'max': [99]
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
            format: wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] + '%' }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider3.on('change', this.changeMultiLevelValue.bind(this, 2))
      } else {
        this._slider3.set(levels.brightness || 0)
      }
    }

    const domSlider4 = $(`#red-slider-${this.props.nodeId}`)[0]
    if (domSlider4) {
      if (!this._slider4 || !domSlider4.noUiSlider) {
        this._slider4 = noUiSlider.create(domSlider4, {
          start: levels.red || 0,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 1],
            '50%': [15, 5],
            '80%': [50, 10],
            '96%': [90, 9],
            'max': [99]
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
            format: wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] + '%' }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider4.on('change', this.changeMultiLevelValue.bind(this, 3))
      } else {
        this._slider4.set(levels.red || 0)
      }
    }

    const domSlider5 = $(`#green-slider-${this.props.nodeId}`)[0]
    if (domSlider5) {
      if (!this._slider5 || !domSlider5.noUiSlider) {
        this._slider5 = noUiSlider.create(domSlider5, {
          start: levels.green || 0,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 1],
            '50%': [15, 5],
            '80%': [50, 10],
            '96%': [90, 9],
            'max': [99]
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
            format: wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] + '%' }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider5.on('change', this.changeMultiLevelValue.bind(this, 4))
      } else {
        this._slider5.set(levels.green || 0)
      }
    }

    const domSlider6 = $(`#blue-slider-${this.props.nodeId}`)[0]
    if (domSlider6) {
      if (!this._slider6 || !domSlider6.noUiSlider) {
        this._slider6 = noUiSlider.create(domSlider6, {
          start: levels.blue || 0,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 1],
            '50%': [15, 5],
            '80%': [50, 10],
            '96%': [90, 9],
            'max': [99]
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
            format: wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] + '%' }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider6.on('change', this.changeMultiLevelValue.bind(this, 5))
      } else {
        this._slider6.set(levels.blue || 0)
      }
    }

    const domSlider7 = $(`#white-slider-${this.props.nodeId}`)[0]
    if (domSlider7) {
      if (!this._slider7 || !domSlider7.noUiSlider) {
        this._slider7 = noUiSlider.create(domSlider7, {
          start: levels.white || 0,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 1],
            '50%': [15, 5],
            '80%': [50, 10],
            '96%': [90, 9],
            'max': [99]
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
            format: wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] + '%' }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider7.on('change', this.changeMultiLevelValue.bind(this, 6))
      } else {
        this._slider7.set(levels.white || 0)
      }
    }

    const domSlider8 = $(`#time-to-complete-transition-slider-${this.props.nodeId}`)[0]
    if (domSlider8) {
      if (!this._slider8 || !domSlider8.noUiSlider) {
        this._slider8 = noUiSlider.create(domSlider8, {
          start: config[configs.TIME_TO_COMPLETE_TRANSITION_MODE_2] || 67, // 67 => 3s
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 1], // => "immediate"
            '1%': [1, 1], // => value*20ms
            '32%': [49, 16], // => 980ms
            '33%': [65, 1], // => [value-64]*1s
            '65%': [123, 70], // => 59s
            '66%': [193, 1], // => [value-192]*1min
            'max': [252] // 60min
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
            filter: (value) => {
              if (value === 0 || value === 65 || value === 193 || value === 252) {
                return 1
              }
              if (value === 25 || value === 94 || value === 222) {
                return 2
              }
              return 0
            },
            format: wNumb({
              decimals: 1,
              edit: mode2SliderEdit
            })
          },
          tooltips: wNumb({
            decimals: 1,
            edit: mode2SliderEdit
          }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider8.on('change', this.changeTimeToCompleteTransitionMode2Value.bind(this))
      } else {
        this._slider8.set(config[configs.TIME_TO_COMPLETE_TRANSITION_MODE_2] || 67) // 67 => 3s
      }
    }

    const domSlider9 = $(`#min-max-slider-${this.props.nodeId}`)[0]
    if (domSlider9) {
      if (!this._slider9 || !domSlider9.noUiSlider) {
        this._slider9 = noUiSlider.create(domSlider9, {
          start: [config[configs.MINIMUM_DIMMER_LEVEL] || 2, config[configs.MAXIMUM_DIMMER_LEVEL] || 255],
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [2, 1],
            '21%': [10, 5],
            '48%': [50, 10],
            '86%': [190, 15],
            'max': [255]
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
            format: wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            })
          },
          tooltips: [
            wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            }), // decimals: 0 does not work...
            wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            })
          ],
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider9.on('change', this.changeMinMax.bind(this))
      } else {
        this._slider9.set([config[configs.MINIMUM_DIMMER_LEVEL] || 2, config[configs.MAXIMUM_DIMMER_LEVEL] || 255])
      }
    }

    const domSlider10 = $(`#auto-dimm-time-slider-${this.props.nodeId}`)[0]
    if (domSlider10) {
      if (!this._slider10 || !domSlider10.noUiSlider) {
        this._slider10 = noUiSlider.create(domSlider10, {
          start: this.state.autoDimmTime || ( 5 * 60 * 1000),
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [500, 250],
            '5%': [1000, 1000],
            '12%': [5000, 5000],
            '19%': [20000, 10000],
            '22%': [30000, 15000],
            '27%': [60000, 60000],
            '37%': [5 * 60000, 5 * 60000],
            '46%': [20 * 60000, 10 * 60000],
            '50%': [30 * 60000, 15 * 60000],
            '56%': [60 * 60000, 30 * 60000],
            '86%': [6 * 60 * 60000, 60 * 60000],
            'max': [12 * 60 * 60000]
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
                if (v < 999) return `${v / 1000}`.substr(0, 4)

                const secs = Math.floor(v / 1000)
                if (secs < 60) return `${secs}s`

                let mins = Math.floor(v / 60000)
                if (mins < 60) return `${mins}m`

                mins = mins % 60
                mins = mins ? `${mins}` : ''
                const hours = Math.floor(v / 3600000)
                return `${hours}h${mins}`
              }
            })
          },
          tooltips: wNumb({
            decimals: 1,
            edit: (v) => {
              if (v < 999) return `${v}`.split('.')[0] + 'ms'

              const secs = Math.floor(v / 1000)
              if (secs < 60) return `${secs}s`

              let mins = Math.floor(v / 60000)
              if (mins < 60) return `${mins}m`

              mins = mins % 60
              mins = mins ? `${mins}` : ''
              const hours = Math.floor(v / 3600000)
              return `${hours}hr${mins}`
            }
          }),
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider10.on('change', this.changeAutoDimmTimeValue.bind(this))
      } else {
        this._slider10.set(this.state.autoDimmTime || ( 5 * 60 * 1000))
      }
    }
  }

  render () {
    const { nodeId, animationLevel, theme, services, productObjectProxy } = this.props
    const { meterLastValue, energyLevel, costLastValue, configuration, panelReady, colorLevelStateId, brightnessLevelState, autoDimmAmount, autoDimmTime } = this.state
    const configs = FibaroFgrgbwm441SettingPanel.configurations

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
          <div className='col s12 m8 l8'>Instant consumption: {Number.parseFloat(energyLevel).toFixed(1) || '0.0'}W.</div>

          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <div className='section card form brightnesses'>
          <div className='col s12'>Highest brightness</div>
          <div className='col s12 slider'>
            <div id={`brightness-slider-${nodeId}`} />
          </div>
          <div className='col s12'>Red</div>
          <div className='col s12 slider'>
            <div id={`red-slider-${nodeId}`} />
          </div>
          <div className='col s12'>Green</div>
          <div className='col s12 slider'>
            <div id={`green-slider-${nodeId}`} />
          </div>
          <div className='col s12'>Blue</div>
          <div className='col s12 slider'>
            <div id={`blue-slider-${nodeId}`} />
          </div>
          <div className='col s12'>White</div>
          <div className='col s12 slider'>
            <div id={`white-slider-${nodeId}`} />
          </div>
        </div>

        <h5>Levels transitions & bounds</h5>
        <div className='section card form'>
          <Row>
            <Select s={12} label='Behaviour of transitions between levels'
              onChange={this.changeConfiguration.bind(this, configs.OUTPUTS_STATE_CHANGE_MODE)} value={`${outputsStateChangeMode}`}>
              <option value='0'>MODE 1 - Constant Speed</option>
              <option value='1'>MODE 2 - Constant Time (RGB/RBGW only)</option>
            </Select>

            {outputsStateChangeMode == 0 && (
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

            {outputsStateChangeMode == 1 && (
              <div>
                <div className='col s12'><br />Time to complete transition: actually {mode2SliderEdit(configuration[configs.TIME_TO_COMPLETE_TRANSITION_MODE_2])}.</div>
                <div className='col s12 slider'>
                  <div id={`time-to-complete-transition-slider-${nodeId}`} />
                </div>
              </div>
            )}

            <div>
              <div className='col s12'><br />Max and min level values (from 2 to 255)</div>
              <div className='col s12 slider'>
                <div id={`min-max-slider-${nodeId}`} />
              </div>
            </div>
          </Row>

          <Row>
            <Select s={12} label='Auto dimm when color left unchanged'
              onChange={this.autoDimmAmountChange.bind(this)} value={`${autoDimmAmount}`}>
              <option value='-1'>Never (No dimm)</option>
              <option value='0'>Dimm to 0% (Turn off)</option>
              <option value='2'>Dimm to 2%</option>
              <option value='5'>Dimm to 5%</option>
              <option value='10'>Dimm to 10%</option>
              <option value='20'>Dimm to 20%</option>
              <option value='30'>Dimm to 30%</option>
              <option value='50'>Dimm to 50%</option>
              <option value='75'>Dimm to 75%</option>
            </Select>
            {autoDimmAmount >= 0 && (
              <div>
                <div className='col s12 slider'>
                  <div id={`auto-dimm-time-slider-${nodeId}`} />
                </div>
              </div>
            )}
          </Row>
        </div>

        <h5>Color control from a state</h5>
        <div className='section card form'>
          <Row>
            <StatesDropdown defaultStateId={colorLevelStateId} onChange={this.colorLevelStateIdChange.bind(this)}
              theme={theme} animationLevel={animationLevel} services={services}
              typeFilter={(e) => e.id === 'level-state'} instanceFilter={(e) => e.typeId === 'level-state'}>
              <option key='no-state-option' value=''>Do not link color to a state</option>
            </StatesDropdown>
          </Row>
          <Row>
            <Select s={12} label='Brightness when state changes'
              onChange={this.brightnessLevelStateChange.bind(this)} value={`${brightnessLevelState}`}>
              <option value='-1'>Keep previous brightness</option>
              <option value='2'>Dimm to 2%</option>
              <option value='5'>Dimm to 5%</option>
              <option value='10'>Dimm to 10%</option>
              <option value='20'>Dimm to 20%</option>
              <option value='30'>Dimm to 30%</option>
              <option value='50'>Dimm to 50%</option>
              <option value='75'>Dimm to 75%</option>
              <option value='99'>Dimm to 100%</option>
            </Select>
          </Row>
        </div>

        <h5>Advanced controls</h5>
        <div className='section card form'>
          <Row>
            <Select s={12} label='Network Switch ALL (ON / OFF feature)'
              onChange={this.changeConfiguration.bind(this, configs.ENABLE_ALL_ON_OFF)} value={`${enableAllOnOff}`}>
              <option value='0'>ALL ON disabled, ALL OFF disabled</option>
              <option value='1'>ALL ON disabled, ALL OFF active</option>
              <option value='2'>ALL ON active, ALL OFF disabled</option>
              <option value='3'>ALL ON active, ALL OFF active</option>
            </Select>
          </Row>

          <Row>
            <Button className={cx('col s12 m6 l4 fluid', theme.actions.inconspicuous)} waves={waves}
              onClick={() => { this.props.productObjectProxy.meterResetCounter() }}>Reset energy meter</Button>
            <div className='col s12 m6 l8'>
              Actually {(meterLastValue && Number.parseFloat(meterLastValue.v || 0).toFixed(2)) || '0.00'} kWh {costLastValue > 0 && (
                <span>&nbsp;({Number.parseFloat(costLastValue).toFixed(2)} ¤)</span>
              )}
            </div>
          </Row>
        </div>
      </div>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }

  changeConfiguration (confIndex, event) {
    const value = event.currentTarget ? event.currentTarget.value : event
    this.setState({
      configuration: { ...this.state.configuration, [confIndex]: value }
    })
    this.props.productObjectProxy.setConfiguration(confIndex, value)
    .catch(console.error)
  }

  changeDimmingStepValueMode1Value (value) {
    this.setState({
      configuration: { ...this.state.configuration, [FibaroFgrgbwm441SettingPanel.configurations.DIMMING_STEP_VALUE_MODE_1]: value[0] }
    })
    this.debouncedDimmingStepValueMode1Value(value[0])
  }

  changeTimeBetweenDimmingStepsMode1Value (value) {
    this.setState({
      configuration: { ...this.state.configuration, [FibaroFgrgbwm441SettingPanel.configurations.TIME_BETWEEN_DIMMING_STEPS_MODE_1]: value[0] }
    })
    this.debouncedTimeBetweenDimmingStepsMode1Value(value[0])
  }

  changeTimeToCompleteTransitionMode2Value (value) {
    this.setState({
      configuration: { ...this.state.configuration, [FibaroFgrgbwm441SettingPanel.configurations.TIME_TO_COMPLETE_TRANSITION_MODE_2]: value[0] }
    })
    this.debouncedTimeToCompleteTransitionMode2Value(value[0])
  }

  changeMultiLevelValue (instance, value) {
    this.props.productObjectProxy.multiLevelSwitchSetValue(value, instance)
  }

  changeMinMax ([min, max]) {
    this.setState({
      configuration: {
        ...this.state.configuration,
        [FibaroFgrgbwm441SettingPanel.configurations.MINIMUM_DIMMER_LEVEL]: min,
        [FibaroFgrgbwm441SettingPanel.configurations.MAXIMUM_DIMMER_LEVEL]: max
      }
    })
    this.debouncedMinMaxDimmerLevel(min, max)
  }

  colorLevelStateIdChange (value) {
    this.props.productObjectProxy.setColorLevelStateId(value)
    .then(() => {
      this.setState({
        colorLevelStateId: value
      })
    })
    .catch(console.error)
  }

  brightnessLevelStateChange (event) {
    const value = parseInt(event.currentTarget.value)
    this.props.productObjectProxy.setBrightnessLevelState(value)
    .then(() => {
      this.setState({
        brightnessLevelState: value
      })
    })
    .catch(console.error)
  }

  autoDimmAmountChange (event) {
    const value = parseInt(event.currentTarget.value)
    this.props.productObjectProxy.setAutoDimmAmount(value)
    .then(() => {
      this.setState({
        autoDimmAmount: value
      })
    })
    .catch(console.error)
  }

  changeAutoDimmTimeValue (value) {
    this.setState({
      autoDimmTime: value[0]
    })
    this.debouncedAutoDimmTimeValueValue(value[0])
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
