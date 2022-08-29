'use strict'

/* global wNumb */
import cx from 'classnames'
import BaseSettingPanel from './base'
import debounce from 'debounce'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Select, Row } from 'react-materialize'

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

class FibaroFgwpe102zw5SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props, FibaroFgwpe102zw5SettingPanel.configurations)
    this.withBinarySwitchSupport(1)

    this.state = {
      ...this.state,
      colorRingBehavior: null,
      colorRingLevelStateId: null,
      meterLastValue: null,
      energyLevel: null,
      stateId: null,
      stateBehavior: null,
      forceBitmaskStatePosition: true,
      controlledBitmaskStatePosition: false
    }

    const configs = FibaroFgwpe102zw5SettingPanel.configurations
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
    this.socket.on('node-event-meter-changed', (nodeId, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }

      if (this.mounted) {
        if (this.state.meterLastValue !== value.value) {
          this.setState({
            meterLastValue: value.value
          })
          this.props.productObjectProxy.energyConsumptionMeterGetLastCost()
          .then(costLastValue => {
            if (this.mounted) {
              this.setState({ costLastValue })
            }
          })
        }
      }
    })
    this.socket.on('node-event-color-behavior-changed', (nodeId, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }

      if (this.mounted) {
        if (this.state.colorRingBehavior !== value) {
          this.setState({
            colorRingBehavior: value
          })
        }
      }
    })
    this.socket.on('node-event-sensor-multi-level-changed', (nodeId, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }

      if (this.mounted) {
        if (this.state.energyLevel !== value.value) {
          this.setState({
            energyLevel: value.value
          })
        }
      }
    })

    const pop = this.props.productObjectProxy
    Promise.all([
      pop.getColorRingBehavior(),
      pop.getColorRingLevelStateId(),
      pop.meterGetLastValue(),
      pop.sensorMultiLevelGetValue(),
      pop.energyConsumptionMeterGetLastCost(),
      pop.getStateId(),
      pop.getStateBehavior(),
      pop.getForceBitmaskStatePosition(),
      pop.getControlledBitmaskStatePosition()
    ])
    .then(([colorRingBehavior, colorRingLevelStateId, meterLastValue, energyLevel, costLastValue,
      stateId, stateBehavior, forceBitmaskStatePosition, controlledBitmaskStatePosition]) => {
      return super.componentDidMount({
        colorRingBehavior,
        colorRingLevelStateId,
        meterLastValue: meterLastValue ? meterLastValue.v : '--',
        energyLevel,
        costLastValue,
        stateId,
        stateBehavior,
        forceBitmaskStatePosition,
        controlledBitmaskStatePosition
      })
    })
    .catch(console.error)
  }

  plugWidgets () {
    const config = this.state.configuration
    const configs = FibaroFgwpe102zw5SettingPanel.configurations

    this.plugConfigurationSlider(
      'overload-safety-value-slider',
      null,
      (config[configs.OVERLOAD_SAFETY_SWITCH] / 10) || 0,
      {
        range: {
          'min': [0],
          '9%': [5, 5],
          '20%': [30, 10],
          '36%': [100, 50],
          '56%': [500, 100],
          '71%': [1000, 250],
          'max': [3000]
        }
      },
      this.changeOverloadSafetyValue.bind(this)
    )

    this.plugConfigurationSlider(
      'periodic-reports-slider',
      configs.POWER_AND_ENERGY_PERIODIC_REPORTS,
      3600,
      {
        range: {
          'min': [0, 10],
          '19%': [60, 60], // 1min
          '32%': [300, 300], // 5mins
          '49%': [1800, 1800], // 30mins
          '64%': [7200, 3600], // 2hrs -> every hour
          'max': [32400]
        },
        pips: { // Show a scale with the slider
          mode: 'steps',
          stepped: true,
          density: 4,
          format: wNumb({ decimals: 1, edit: minuter })
        },
        tooltips: wNumb({ decimals: 1, edit: minuter })
      },
      this.changePeriodicReports.bind(this)
    )

    this.plugConfigurationSlider(
      'power-load-violet-slider',
      null,
      (config[configs.POWER_LOAD_FOR_VIOLET_COLOR] / 10) || 2500,
      {
        range: {
          'min': [100, 50],
          '60%': [1000, 250],
          'max': [3000]
        }
      },
      this.changePowerLoadVioletColor.bind(this)
    )
  }

  render () {
    const { nodeId, animationLevel, theme, services, productObjectProxy } = this.props
    const { switchStates, colorRingBehavior, configuration, meterLastValue, panelReady, energyLevel } = this.state
    const { colorRingLevelStateId, costLastValue, stateId, stateBehavior } = this.state
    const { forceBitmaskStatePosition, controlledBitmaskStatePosition } = this.state
    const colors = FibaroFgwpe102zw5SettingPanel.colorBehaviors

    const c = FibaroFgwpe102zw5SettingPanel.configurations
    const alwaysOn = configuration[c.ALWAYS_ON_FUNCTION] === true || configuration[c.ALWAYS_ON_FUNCTION] === 'Active'
    const rememberStateAfterFailure =
        configuration[c.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE] === true ||
        configuration[c.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE] === 'Wall Plug memorizes its state after a power failure'
    const overloadSafetySwitch = configuration[c.OVERLOAD_SAFETY_SWITCH]
    const powerLoadVioletColor = configuration[c.POWER_LOAD_FOR_VIOLET_COLOR]
    const periodicReports = configuration[c.POWER_AND_ENERGY_PERIODIC_REPORTS]

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m12 l5'>Wall plug settings</h4>
          <Button className={cx('col s12 m3 l2 fluid', theme.actions.secondary)} waves={waves} disabled={alwaysOn}
            onClick={this.invertBinarySwitchState.bind(this, 1)}>Turn {(alwaysOn || switchStates[0]) ? 'OFF' : 'ON'}</Button>
          <div className='col s12 m9 l5'>Plug #{nodeId} switch actually "{(alwaysOn || switchStates[0]) ? 'ON' : 'OFF'}" at {energyLevel | '0.0'}W.</div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <h5>Color ring behavior</h5>
        <Row className='section card form'>
          <Select s={12} m={colorRingBehavior === colors.STATUS_FROM_SCENARIO_STATE ? 6 : 12} label='Choose lightning feature'
            onChange={this.colorRingBehaviorChange.bind(this)} value={`${colorRingBehavior}`}>
            <option value={colors.DEVICE_DEFAULT}>Device default (depending on comsumption when ON, no light when OFF)</option>
            <option value={colors.NIGHT_LIGHT}>Use as night light when OFF (default behavior when ON)</option>
            <option value={colors.STATUS_FROM_SCENARIO_STATE}>Control colors through a scenarii state</option>
          </Select>
          {colorRingBehavior === colors.STATUS_FROM_SCENARIO_STATE ? (
            <div className='col s12 m6'>
              <StatesDropdown defaultStateId={colorRingLevelStateId} onChange={this.colorRingLevelStateIdChange.bind(this)}
                theme={theme} animationLevel={animationLevel} services={services}
                typeFilter={(e) => e.id === 'level-state'} instanceFilter={(e) => e.typeId === 'level-state'} />
            </div>
          ) : null}
        </Row>

        <h5>Safety</h5>
        <Row className='section card form'>
          <div className='col s12'>Overload safety switch: actually {overloadSafetySwitch ? `${overloadSafetySwitch / 10}W` : 'OFF'}.</div>
          <div className='col s12 slider'>
            <div id={`overload-safety-value-slider-${nodeId}`} />
          </div>
        </Row>

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
            <Select key={0} s={12} m={6} label='Choose bitmask state position behavior'
              onChange={this.stateBehaviorChange.bind(this)} value={`${stateBehavior}`}>
              <option value='1'>Set state position 1 (to 1) when ON</option>
              <option value='-1'>Set state position 1 (to 1) when closed</option>
              <option value='2'>Set state position 2 (to 1) when ON</option>
              <option value='-2'>Set state position 2 (to 1) when closed</option>
              <option value='4'>Set state position 3 (to 1) when ON</option>
              <option value='-4'>Set state position 3 (to 1) when closed</option>
              <option value='8'>Set state position 4 (to 1) when ON</option>
              <option value='-8'>Set state position 4 (to 1) when closed</option>
              <option value='16'>Set state position 5 (to 1) when ON</option>
              <option value='-16'>Set state position 5 (to 1) when closed</option>
              <option value='32'>Set state position 6 (to 1) when ON</option>
              <option value='-32'>Set state position 6 (to 1) when closed</option>
              <option value='64'>Set state position 7 (to 1) when ON</option>
              <option value='-64'>Set state position 7 (to 1) when closed</option>
              <option value='128'>Set state position 8 (to 1) when ON</option>
              <option value='-128'>Set state position 8 (to 1) when closed</option>
              <option value='256'>Set state position 9 (to 1) when opened</option>
              <option value='-256'>Set state position 9 (to 1) when closed</option>
              <option value='512'>Set state position 10 (to 1) when opened</option>
              <option value='-512'>Set state position 10 (to 1) when closed</option>
            </Select>,
            <Select key={1} s={12} label='Choose bitmask state control behavior' icon='sync_alt'
              onChange={this.changeForceBitmaskStatePosition.bind(this)} value={forceBitmaskStatePosition ? 'force' : (controlledBitmaskStatePosition ? 'controlled' : 'none')}>
              <option value='force'>Force mode: Device will be the only one allowed to control the state</option>
              <option value='none'>Follow mode: Device will follow any state change but can be controlled anyway</option>
              <option value='controlled'>Controlled mode: state and device can control each others (warning: avoid loops with scenario actions!)</option>
            </Select>
          ]}

        </Row>

        <h5>Advanced</h5>
        <div className='section card form'>
          <Row>
            <div className='col s12 m5 l3'>
              <div className='switch'>
                <label>
                  ON/OFF
                  <input type='checkbox' name='always-on' value='always-on' checked={alwaysOn}
                    onChange={() => { this.changeConfiguration(c.ALWAYS_ON_FUNCTION, !alwaysOn) }} />
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
                    onChange={() => { this.changeConfiguration(c.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE, !rememberStateAfterFailure) }} />
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
              Actually {meterLastValue || '0.00'} kWh {costLastValue > 0 && (
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
    ) : super.render()
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

  colorRingBehaviorChange (event) {
    const value = parseInt(event.currentTarget.value)
    this.props.productObjectProxy.setColorRingBehavior(value)
    .then(() => {
      this.setState({ colorRingBehavior: value })
    })
    .catch(console.error)
  }

  colorRingLevelStateIdChange (value) {
    this.props.productObjectProxy.setColorRingLevelStateId(value)
    .then(() => {
      this.setState({ colorRingLevelStateId: value })
    })
    .catch(console.error)
  }

  stateIdChange (value) {
    this.props.productObjectProxy.setStateId(value)
    .then(() => {
      this.setState({ stateId: value })
    })
    .catch(console.error)
  }

  stateBehaviorChange (event) {
    const value = parseInt(event.currentTarget.value)
    this.props.productObjectProxy.setStateBehavior(value)
    .then(() => {
      this.setState({ stateBehavior: value })
    })
    .catch(console.error)
  }

  changeForceBitmaskStatePosition (event) {
    const value = event.currentTarget.value
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
  ...BaseSettingPanel.propTypes,
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
