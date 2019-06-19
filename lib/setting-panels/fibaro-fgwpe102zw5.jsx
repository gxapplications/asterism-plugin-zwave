'use strict'

/* global $, noUiSlider, wNumb */
import cx from 'classnames'
import debounce from 'debounce'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Icon, Input, Preloader, Row } from 'react-materialize'

import { Scenarii } from 'asterism-plugin-library'

import NameLocation from './name-location'

const { StatesDropdown } = Scenarii

const minuter = (seconds) => {
  if (seconds <= 60) {
    return `${Math.round(seconds)}s`
  }
  if (seconds < 7200) {
    return `${Math.round(seconds / 60)}m`
  }
  return `${Math.round(seconds / 3600)}hrs`
}

class FibaroFgwpe102zw5SettingPanel extends React.Component {
  constructor (props) {
    super(props)

    const configs = FibaroFgwpe102zw5SettingPanel.configurations
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      switchState: null,
      colorRingBehavior: null,
      colorRingLevelStateId: null,
      configuration: {
        [configs.ALWAYS_ON_FUNCTION]: null,
        [configs.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE]: null,
        [configs.OVERLOAD_SAFETY_SWITCH]: null,
        [configs.POWER_LOAD_FOR_VIOLET_COLOR]: null,
        [configs.POWER_AND_ENERGY_PERIODIC_REPORTS]: null
      },
      meterLastValue: null,
      panelReady: false,
      energyLevel: null,
      stateId: null,
      stateBehavior: null,
      forceBitmaskStatePosition: true,
      controlledBitmaskStatePosition: false
    }

    this._socket = props.privateSocket
    this._mounted = false

    this.debouncedOverloadSafetyValue = debounce((value) => {
      this.changeConfiguration(configs.OVERLOAD_SAFETY_SWITCH, value)
    }, 1200, false)
    this.debouncedPowerLoadVioletColor = debounce((value) => {
      this.changeConfiguration(configs.POWER_LOAD_FOR_VIOLET_COLOR, value)
    }, 1200, false)
    this.debouncedPeriodicReports = debounce((value) => {
      this.changeConfiguration(configs.POWER_AND_ENERGY_PERIODIC_REPORTS, value)
    }, 1200, false)
  }

  componentDidMount () {
    const configs = FibaroFgwpe102zw5SettingPanel.configurations
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
    this._socket.on('node-event-meter-changed', (nodeId, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }

      if (this._mounted) {
        if (this.state.meterLastValue !== value.value) {
          this.setState({
            meterLastValue: value.value
          })
        }
      }
    })
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
    this._socket.on('node-event-color-behavior-changed', (nodeId, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }

      if (this._mounted) {
        if (this.state.colorRingBehavior !== value) {
          this.setState({
            colorRingBehavior: value
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
      o.binarySwitchGetState(),
      o.getColorRingBehavior(),
      o.getColorRingLevelStateId(),
      o.getConfiguration(configs.ALWAYS_ON_FUNCTION),
      o.getConfiguration(configs.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE),
      o.getConfiguration(configs.OVERLOAD_SAFETY_SWITCH),
      o.getConfiguration(configs.POWER_LOAD_FOR_VIOLET_COLOR),
      o.getConfiguration(configs.POWER_AND_ENERGY_PERIODIC_REPORTS),
      o.meterGetLastValue(),
      o.sensorMultiLevelGetValue(),
      o.energyConsumptionMeterGetLastCost(),
      o.getStateId(),
      o.getStateBehavior(),
      o.getForceBitmaskStatePosition(),
      o.getControlledBitmaskStatePosition()
    ])
    .then(([switchState, colorRingBehavior, colorRingLevelStateId, alwaysOn, rememberStateAfterFailure, overloadSafetySwitch,
      powerLoadVioletColor, periodicReports, meterLastValue, energyLevel, costLastValue, stateId, stateBehavior,
      forceBitmaskStatePosition, controlledBitmaskStatePosition]) => {
      this.setState({
        switchState,
        colorRingBehavior,
        colorRingLevelStateId,
        configuration: {
          [configs.ALWAYS_ON_FUNCTION]: alwaysOn,
          [configs.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE]: rememberStateAfterFailure,
          [configs.OVERLOAD_SAFETY_SWITCH]: overloadSafetySwitch,
          [configs.POWER_LOAD_FOR_VIOLET_COLOR]: powerLoadVioletColor,
          [configs.POWER_AND_ENERGY_PERIODIC_REPORTS]: periodicReports
        },
        meterLastValue: meterLastValue ? meterLastValue.v : '--',
        panelReady: true,
        energyLevel,
        costLastValue,
        stateId,
        stateBehavior,
        forceBitmaskStatePosition,
        controlledBitmaskStatePosition
      })

      this.plugWidgets()
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }

  componentWillUpdate (nextProps, nextState) {
    // Because of react-materialize bad behaviors...
    if (this._colorRingBehavior && (this.state.colorRingBehavior !== nextState.colorRingBehavior)) {
      this._colorRingBehavior.setState({ value: nextState.colorRingBehavior })
    }
  }

  componentDidUpdate (prevProps, prevState) {
    this.plugWidgets()
  }

  plugWidgets () {
    const config = this.state.configuration
    const configs = FibaroFgwpe102zw5SettingPanel.configurations

    const domSlider1 = $(`#overload-safety-value-slider-${this.props.nodeId}`)[0]
    if (domSlider1) {
      if (!this._slider1 || !domSlider1.noUiSlider) {
        this._slider1 = noUiSlider.create(domSlider1, {
          start: (config[configs.OVERLOAD_SAFETY_SWITCH] / 10) || 0,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0],
            '9%': [5, 5],
            '20%': [30, 10],
            '36%': [100, 50],
            '56%': [500, 100],
            '71%': [1000, 250],
            'max': [3000]
          },
          format: wNumb({
            decimals: 1
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            stepped: true,
            density: 4
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider1.on('change', this.changeOverloadSafetyValue.bind(this))
      } else {
        this._slider1.set((config[configs.OVERLOAD_SAFETY_SWITCH] / 10) || 0)
      }
    }

    const domSlider2 = $(`#periodic-reports-slider-${this.props.nodeId}`)[0]
    if (domSlider2) {
      if (!this._slider2 || !domSlider2.noUiSlider) {
        this._slider2 = noUiSlider.create(domSlider2, {
          start: config[configs.POWER_AND_ENERGY_PERIODIC_REPORTS] || 3600,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 10],
            '19%': [60, 60], // 1min
            '32%': [300, 300], // 5mins
            '49%': [1800, 1800], // 30mins
            '64%': [7200, 3600], // 2hrs -> every hour
            'max': [32400]
          },
          format: wNumb({
            decimals: 1
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            stepped: true,
            density: 4,
            format: wNumb({ decimals: 1, edit: minuter })
          },
          tooltips: wNumb({ decimals: 1, edit: minuter }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider2.on('change', this.changePeriodicReports.bind(this))
      } else {
        this._slider2.set(config[configs.POWER_AND_ENERGY_PERIODIC_REPORTS] || 3600)
      }
    }

    const domSlider3 = $(`#power-load-violet-slider-${this.props.nodeId}`)[0]
    if (domSlider3) {
      if (!this._slider3 || !domSlider3.noUiSlider) {
        this._slider3 = noUiSlider.create(domSlider3, {
          start: (config[configs.POWER_LOAD_FOR_VIOLET_COLOR] / 10) || 2500,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [100, 50],
            '60%': [1000, 250],
            'max': [3000]
          },
          format: wNumb({
            decimals: 1
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            stepped: true,
            density: 4
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider3.on('change', this.changePowerLoadVioletColor.bind(this))
      } else {
        this._slider3.set((config[configs.POWER_LOAD_FOR_VIOLET_COLOR] / 10) || 2500)
      }
    }
  }

  render () {
    const { nodeId, animationLevel, theme, services, productObjectProxy } = this.props
    const { switchState, colorRingBehavior, configuration, meterLastValue, panelReady, energyLevel, colorRingLevelStateId,
        costLastValue, stateId, stateBehavior, forceBitmaskStatePosition, controlledBitmaskStatePosition } = this.state
    const colors = FibaroFgwpe102zw5SettingPanel.colorBehaviors
    const configs = FibaroFgwpe102zw5SettingPanel.configurations
    const alwaysOn = configuration[configs.ALWAYS_ON_FUNCTION] === true || configuration[configs.ALWAYS_ON_FUNCTION] === 'Active'
    const rememberStateAfterFailure =
        configuration[configs.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE] === true ||
        configuration[configs.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE] === 'Wall Plug memorizes its state after a power failure'
    const overloadSafetySwitch = configuration[configs.OVERLOAD_SAFETY_SWITCH]
    const powerLoadVioletColor = configuration[configs.POWER_LOAD_FOR_VIOLET_COLOR]
    const periodicReports = configuration[configs.POWER_AND_ENERGY_PERIODIC_REPORTS]

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m12 l5'>Wall plug settings</h4>
          <Button className={cx('col s12 m3 l2 fluid', theme.actions.secondary)} waves={waves} disabled={alwaysOn}
            onClick={() => { this.binarySwitchStateChange(!switchState) }}>Turn {(alwaysOn || switchState) ? 'OFF' : 'ON'}</Button>
          <div className='col s12 m9 l5'>Plug #{nodeId} switch actually "{(alwaysOn || switchState) ? 'ON' : 'OFF'}" at {energyLevel | '0.0'}W.</div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>
        <hr />

        <h5>Color ring behavior</h5>
        <Row className='section card form'>
          <Input s={12} m={colorRingBehavior === colors.STATUS_FROM_SCENARIO_STATE ? 6 : 12} type='select'
            label='Choose lightning feature' ref={(c) => { this._colorRingBehavior = c }}
            onChange={this.colorRingBehaviorChange.bind(this)} value={`${colorRingBehavior}`}>
            <option value={colors.DEVICE_DEFAULT}>Device default (depending on comsumption when ON, no light when OFF)</option>
            <option value={colors.NIGHT_LIGHT}>Use as night light when OFF (default behavior when ON)</option>
            <option value={colors.STATUS_FROM_SCENARIO_STATE}>Control colors through a scenarii state</option>
          </Input>
          {colorRingBehavior === colors.STATUS_FROM_SCENARIO_STATE ? (
            <div className='col s12 m6'>
              <StatesDropdown defaultStateId={colorRingLevelStateId} onChange={this.colorRingLevelStateIdChange.bind(this)}
                theme={theme} animationLevel={animationLevel} services={services}
                typeFilter={(e) => e.id === 'level-state'} instanceFilter={(e) => e.typeId === 'level-state'} />
            </div>
          ) : null}
        </Row>
        <hr />

        <h5>Safety</h5>
        <Row className='section card form'>
          <div className='col s12'>Overload safety switch: actually {overloadSafetySwitch ? `${overloadSafetySwitch / 10}W` : 'OFF'}.</div>
          <div className='col s12 slider'>
            <div id={`overload-safety-value-slider-${nodeId}`} />
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

          {!!stateId && (stateId.length > 0) && [
            <Input key={0} s={12} m={6} type='select' label='Choose bitmask state position behavior' ref={(c) => { this._stateBehavior = c }}
              onChange={this.stateBehaviorChange.bind(this)} value={stateBehavior}>
              <option value={1}>Set state position 1 (to 1) when ON</option>
              <option value={-1}>Set state position 1 (to 1) when closed</option>
              <option value={2}>Set state position 2 (to 1) when ON</option>
              <option value={-2}>Set state position 2 (to 1) when closed</option>
              <option value={4}>Set state position 3 (to 1) when ON</option>
              <option value={-4}>Set state position 3 (to 1) when closed</option>
              <option value={8}>Set state position 4 (to 1) when ON</option>
              <option value={-8}>Set state position 4 (to 1) when closed</option>
              <option value={16}>Set state position 5 (to 1) when ON</option>
              <option value={-16}>Set state position 5 (to 1) when closed</option>
              <option value={32}>Set state position 6 (to 1) when ON</option>
              <option value={-32}>Set state position 6 (to 1) when closed</option>
              <option value={64}>Set state position 7 (to 1) when ON</option>
              <option value={-64}>Set state position 7 (to 1) when closed</option>
              <option value={128}>Set state position 8 (to 1) when ON</option>
              <option value={-128}>Set state position 8 (to 1) when closed</option>
            </Input>,
            <Input key={1} s={12} type='select' label='Choose bitmask state control behavior' ref={(c) => { this._stateControlBehavior = c }}
              onChange={this.changeForceBitmaskStatePosition.bind(this)} value={forceBitmaskStatePosition ? 'force' : (controlledBitmaskStatePosition ? 'controlled' : 'none')}>
              <option value='force'>Force mode: Device will be the only one allowed to control the state</option>
              <option value='none'>No restriction mode</option>
              <option value='controlled'>Controlled mode: state and device can control each others (warning: avoid loops with scenario actions!)</option>
            </Input>
          ]}

        </Row>
        <hr />

        <h5>Advanced</h5>
        <div className='section card form'>
          <Row>
            <div className='col s12 m5 l3'>
              <div className='switch'>
                <label>
                  ON/OFF
                  <input type='checkbox' name='always-on' value='always-on' checked={alwaysOn}
                    onChange={() => { this.changeConfiguration(configs.ALWAYS_ON_FUNCTION, !alwaysOn) }} />
                  <span className='lever'></span>
                  Always ON
                </label>
              </div>
            </div>
            <div className='col s12 m7 l9'>
              "Always ON" feature (avoid switch to turn OFF, to use other device features).
            </div>
          </Row>
          <Row>
            <div className='col s12 m5 l3'>
              <div className='switch'>
                <label>
                  OFF
                  <input type='checkbox' name='remember-state-failure' value='remember-state-failure' checked={rememberStateAfterFailure}
                    onChange={() => { this.changeConfiguration(configs.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE, !rememberStateAfterFailure) }} />
                  <span className='lever'></span>
                  Previous state
                </label>
              </div>
            </div>
            <div className='col s12 m7 l9'>
              Restore switch status after power failure.
            </div>
          </Row>

          <br />

          <Row>
            <Button className={cx('col s12 m6 l4 fluid', theme.actions.inconspicuous)} waves={waves}
              onClick={() => { this.props.productObjectProxy.meterResetCounter() }}>Reset energy meter</Button>
            <div className='col s12 m6 l8'>
              Actually {meterLastValue ? meterLastValue : '0.00'} kWh {costLastValue > 0 && (
                <span>&nbsp;({Number.parseFloat(costLastValue).toFixed(2)} ¤)</span>
              )}
            </div>
          </Row>

          <Row>
            <div className='col s12'>Power / Energy periodic report interval: actually {periodicReports > 0 ? minuter(periodicReports) : 'OFF'}.</div>
            <div className='col s12 slider'>
              <div id={`periodic-reports-slider-${nodeId}`} />
            </div>
          </Row>

          <Row>
            <div className='col s12'>Power load corresponding to violet color: actually {powerLoadVioletColor / 10}W.</div>
            <div className='col s12 slider'>
              <div id={`power-load-violet-slider-${nodeId}`} />
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

  changeOverloadSafetyValue (v) {
    let value = v * 10
    if (value > 0) {
      if (value < 10) {
        value = 10
      }
      if (value > 30000) {
        value = 30000
      }
    }
    this.setState({
      configuration: { ...this.state.configuration, [FibaroFgwpe102zw5SettingPanel.configurations.OVERLOAD_SAFETY_SWITCH]: value }
    })
    this.debouncedOverloadSafetyValue(value)
  }

  changePowerLoadVioletColor (v) {
    let value = v * 10
    if (value < 1000) {
      value = 1000
    }
    if (value > 30000) {
      value = 30000
    }
    this.setState({
      configuration: { ...this.state.configuration, [FibaroFgwpe102zw5SettingPanel.configurations.POWER_LOAD_FOR_VIOLET_COLOR]: value }
    })
    this.debouncedPowerLoadVioletColor(value)
  }

  changePeriodicReports (value) {
    if (value > 0) {
      if (value < 5) {
        value = 5
      }
      if (value > 32400) {
        value = 32400
      }
    }
    this.setState({
      configuration: { ...this.state.configuration, [FibaroFgwpe102zw5SettingPanel.configurations.POWER_AND_ENERGY_PERIODIC_REPORTS]: value }
    })
    this.debouncedPeriodicReports(value)
  }

  changeConfiguration (confIndex, value) {
    this.props.productObjectProxy.setConfiguration(confIndex, value)
    .then(() => {
      this.setState({
        configuration: { ...this.state.configuration, [confIndex]: value }
      })
    })
    .catch(console.error)
  }

  binarySwitchStateChange (newState) {
    this.props.productObjectProxy.binarySwitchInvert()
    .catch(console.error)
  }

  colorRingBehaviorChange (event) {
    const value = parseInt(event.target.value)
    this.props.productObjectProxy.setColorRingBehavior(value)
    .then(() => {
      this.setState({
        colorRingBehavior: value
      })
    })
    .catch(console.error)
  }

  colorRingLevelStateIdChange (value) {
    this.props.productObjectProxy.setColorRingLevelStateId(value)
    .then(() => {
      this.setState({
        colorRingLevelStateId: value
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

  stateBehaviorChange (event, value) {
    this.props.productObjectProxy.setStateBehavior(value)
    .then(() => {
      this.setState({
        stateBehavior: value
      })
    })
    .catch(console.error)
  }

  changeForceBitmaskStatePosition (event) {
    const value = event.target.value
    switch (value) {
      case 'force':
        return this.props.productObjectProxy.setControlledBitmaskStatePosition(false)
        .then(() => this.props.productObjectProxy.setForceBitmaskStatePosition(true))
        .then(() => {
          this.setState({
            forceBitmaskStatePosition: true,
            controlledBitmaskStatePosition: false
          })
        })
        .catch(console.error)
      case 'controlled':
        return this.props.productObjectProxy.setForceBitmaskStatePosition(false)
        .then(() => this.props.productObjectProxy.setControlledBitmaskStatePosition(true))
        .then(() => {
          this.setState({
            forceBitmaskStatePosition: false,
            controlledBitmaskStatePosition: true
          })
        })
        .catch(console.error)
      case 'none':
      default:
        return this.props.productObjectProxy.setControlledBitmaskStatePosition(false)
        .then(() => this.props.productObjectProxy.setForceBitmaskStatePosition(false))
        .then(() => {
          this.setState({
            forceBitmaskStatePosition: false,
            controlledBitmaskStatePosition: false
          })
        })
        .catch(console.error)
    }
  }
}

FibaroFgwpe102zw5SettingPanel.propTypes = {
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

FibaroFgwpe102zw5SettingPanel.colorBehaviors = {
  DEVICE_DEFAULT: 0,
  NIGHT_LIGHT: 1,
  STATUS_FROM_SCENARIO_STATE: 2
}

FibaroFgwpe102zw5SettingPanel.configurations = {
  ALWAYS_ON_FUNCTION: 1,
  POWER_AND_ENERGY_PERIODIC_REPORTS: 14,
  REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE: 2,
  OVERLOAD_SAFETY_SWITCH: 3,
  POWER_LOAD_FOR_VIOLET_COLOR: 40
}

export default FibaroFgwpe102zw5SettingPanel
