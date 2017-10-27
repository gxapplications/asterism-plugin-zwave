'use strict'

/* global $ */
import cx from 'classnames'
import debounce from 'debounce'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Icon, Input, Preloader, Row } from 'react-materialize'

class FibaroFgwpe102zw5SettingPanel extends React.Component {
  constructor (props) {
    super(props)

    const configs = FibaroFgwpe102zw5SettingPanel.configurations

    this.state = {
      switchState: null,
      colorRingBehavior: null,
      configuration: {
        [configs.ALWAYS_ON_FUNCTION]: null,
        [configs.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE]: null,
        [configs.OVERLOAD_SAFETY_SWITCH]: null,
        [configs.POWER_LOAD_FOR_VIOLET_COLOR]: null,
        [configs.POWER_AND_ENERGY_PERIODIC_REPORTS]: null
      },
      meterLastValue: null,
      panelReady: false
    }

    this._socket = props.privateSocket
    this._mounted = false

    this.debouncedOverloadSafetyValue = debounce((value) => {
      this.changeConfiguration(configs.OVERLOAD_SAFETY_SWITCH, value)
    }, 1400, false)
    this.debouncedPowerLoadVioletColor = debounce((value) => {
      this.changeConfiguration(configs.POWER_LOAD_FOR_VIOLET_COLOR, value)
    }, 1400, false)
    this.debouncedPeriodicReports = debounce((value) => {
      this.changeConfiguration(configs.POWER_AND_ENERGY_PERIODIC_REPORTS, value)
    }, 1400, false)
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

      console.log('#####', nodeId, value) // TODO !0: to test with a comsumption
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

      console.log('#####', nodeId, value) // TODO !0: to test
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

      console.log('#####', nodeId, value) // TODO !0: to test
      if (this._mounted) {
        if (this.state.colorRingBehavior !== value) {
          this.setState({
            colorRingBehavior: value
          })
        }
      }
    })

    Promise.all([
      this.props.productObjectProxy.binarySwitchGetState(),
      this.props.productObjectProxy.getColorRingBehavior(),
      this.props.productObjectProxy.getConfiguration(configs.ALWAYS_ON_FUNCTION),
      this.props.productObjectProxy.getConfiguration(configs.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE),
      this.props.productObjectProxy.getConfiguration(configs.OVERLOAD_SAFETY_SWITCH),
      this.props.productObjectProxy.getConfiguration(configs.POWER_LOAD_FOR_VIOLET_COLOR),
      this.props.productObjectProxy.getConfiguration(configs.POWER_AND_ENERGY_PERIODIC_REPORTS),
      this.props.productObjectProxy.mixinMeterGetLastValue()
    ])
    .then(([switchState, colorRingBehavior, alwaysOn, rememberStateAfterFailure, overloadSafetySwitch,
      powerLoadVioletColor, periodicReports, meterLastValue]) => {
      this.setState({
        switchState,
        colorRingBehavior,
        configuration: {
          [configs.ALWAYS_ON_FUNCTION]: alwaysOn,
          [configs.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE]: rememberStateAfterFailure,
          [configs.OVERLOAD_SAFETY_SWITCH]: overloadSafetySwitch,
          [configs.POWER_LOAD_FOR_VIOLET_COLOR]: powerLoadVioletColor,
          [configs.POWER_AND_ENERGY_PERIODIC_REPORTS]: periodicReports
        },
        meterLastValue,
        panelReady: true
      })
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }

  render () {
    const { nodeId, animationLevel, theme } = this.props
    const { switchState, colorRingBehavior, configuration, meterLastValue, panelReady } = this.state
    const colors = FibaroFgwpe102zw5SettingPanel.colorBehaviors
    const configs = FibaroFgwpe102zw5SettingPanel.configurations

    const alwaysOn = !!configuration[configs.ALWAYS_ON_FUNCTION]
    const rememberStateAfterFailure = configuration[configs.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE]
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
          <div className='col s12 m9 l5'>Plug #{nodeId} switch actually "{(alwaysOn || switchState) ? 'ON' : 'OFF'}".</div>
        </Row>
        <hr />

        <h5>Color ring behavior</h5>
        <Row className='section card form'>
          <Input s={12} type='select' label="Choose lightning feature"
            onChange={this.colorRingBehaviorChange.bind(this)} defaultValue={colorRingBehavior}>
            <option value={colors.DEVICE_DEFAULT}>Device default (depending on comsumption when ON, no light when OFF)</option>
            <option value={colors.NIGHT_LIGHT}>Use as night light when OFF (default behavior when ON)</option>
            <option value={colors.STATUS_FROM_SCENARIO_ACTION}>Control colors through scenarii/actions</option>
          </Input>
        </Row>
        <hr />

        <h5>Safety</h5>
        <Row className='section card form'>
          <div className='col s12'>Overload safety switch: actually {overloadSafetySwitch ? `${overloadSafetySwitch / 10}W` : 'OFF'}.</div>
          <div className='range-field col s12'>
            <input type='range' list='overload-ticks' min='0' max='3000' onChange={this.changeOverloadSafetyValue.bind(this)}
              value={overloadSafetySwitch / 10} />
            <datalist id='overload-ticks'>
              <option label='OFF'>0</option>
              <option>1</option>
              <option>5</option>
              <option label='10W'>10</option>
              <option>20</option>
              <option>30</option>
              <option>40</option>
              <option>50</option>
              <option>75</option>
              <option label='100W'>100</option>
              <option>150</option>
              <option>200</option>
              <option>250</option>
              <option label='300W'>300</option>
              <option>350</option>
              <option>400</option>
              <option>450</option>
              <option label='500W'>500</option>
              <option>600</option>
              <option>700</option>
              <option>800</option>
              <option>900</option>
              <option label='1000W'>1000</option>
              <option>1250</option>
              <option label='1500W'>1500</option>
              <option>1750</option>
              <option label='2000W'>2000</option>
              <option label='2500W'>2500</option>
              <option label='3000W'>3000</option>
            </datalist>
          </div>
        </Row>
        <hr />

        <h5>Advanced</h5>
        <div className='section card form'>
          <Row>
            <div className='col s12 m3 l2'>
              <Input name='always-on' type='switch' value='always-on' defaultChecked={alwaysOn}
                onChange={() => { this.changeConfiguration(configs.ALWAYS_ON_FUNCTION, !alwaysOn) }} />
            </div>
            <div className='col s12 m9 l10'>
              "Always ON" feature (avoid switch to turn OFF, to use other device features).
            </div>
          </Row>
          <Row>
            <div className='col s12 m3 l2'>
              <Input name='remember-state-failure' type='switch' value='remember-state-failure' defaultChecked={rememberStateAfterFailure}
                onChange={() => { this.changeConfiguration(
                  configs.REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE,
                  !rememberStateAfterFailure
                ) }}
              />
            </div>
            <div className='col s12 m9 l10'>
              Restore switch status after power failure.
            </div>
          </Row>

          <br />

          <Row>
            <Button className={cx('col s12 m6 l4 fluid', theme.actions.inconspicuous)} waves={waves}
              onClick={() => { this.props.productObjectProxy.mixinMeterResetCounter() }}>Reset energy meter</Button>
            <div className='col s12 m6 l8'>
              Actually {meterLastValue ? meterLastValue.v : '0'} kWh
            </div>
          </Row>

          <Row>
            <div className='col s12'>Power / Energy periodic report interval: actually {periodicReports > 0 ? `${periodicReports}secs` : 'OFF'}.</div>
            <div className='range-field col s12'>
              <input type='range' list='reports-ticks' min='0' max='32400' onChange={this.changePeriodicReports.bind(this)}
                     value={periodicReports} />
              <datalist id='reports-ticks'>
                <option label='OFF'>0</option>
                <option>5</option>
                <option>10</option>
                <option>20</option>
                <option>30</option>
                <option>45</option>
                <option label='1min'>60</option>
                <option>120</option>
                <option>300</option>
                <option label='10mins'>600</option>
                <option>900</option>
                <option>1200</option>
                <option label='30mins'>1800</option>
                <option>2700</option>
                <option label='1hr'>3600</option>
                <option label='2hrs'>7200</option>
                <option label='3hrs'>10800</option>
                <option label='4hrs'>14400</option>
                <option label='5hrs'>18000</option>
                <option label='6hrs'>21600</option>
                <option label='9hrs'>32400</option>
              </datalist>
            </div>
          </Row>

          <Row>
            <div className='col s12'>Power load corresponding to violet color: actually {powerLoadVioletColor / 10}W.</div>
            <div className='range-field col s12'>
              <input type='range' list='violet-ticks' min='100' max='3000' onChange={this.changePowerLoadVioletColor.bind(this)}
                value={powerLoadVioletColor / 10} />
              <datalist id='violet-ticks'>
                <option label='100W'>100</option>
                <option>150</option>
                <option>200</option>
                <option>250</option>
                <option label='300W'>300</option>
                <option>350</option>
                <option>400</option>
                <option>450</option>
                <option label='500W'>500</option>
                <option>600</option>
                <option>700</option>
                <option>800</option>
                <option>900</option>
                <option label='1000W'>1000</option>
                <option>1250</option>
                <option label='1500W'>1500</option>
                <option>1750</option>
                <option label='2000W'>2000</option>
                <option label='2500W'>2500</option>
                <option label='3000W'>3000</option>
              </datalist>
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

  changeOverloadSafetyValue (event) {
    let value = event.target.value * 10
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

  changePowerLoadVioletColor (event) {
    let value = event.target.value * 10
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

  changePeriodicReports (event) {
    let value = event.target.value
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
    .then(() => {
      this.setState({
        switchState: newState
      })
    })
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

}

FibaroFgwpe102zw5SettingPanel.propTypes = {
  serverStorage: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  localStorage: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  privateSocket: PropTypes.object.isRequired,
  productObjectProxy: PropTypes.object.isRequired,
  nodeId: PropTypes.number.isRequired
}

FibaroFgwpe102zw5SettingPanel.colorBehaviors = {
  DEVICE_DEFAULT: 0,
  NIGHT_LIGHT: 1,
  STATUS_FROM_SCENARIO_ACTION: 2
}

FibaroFgwpe102zw5SettingPanel.configurations = {
  ALWAYS_ON_FUNCTION: 1,
  POWER_AND_ENERGY_PERIODIC_REPORTS: 14,
  REMEMBER_DEVICE_STATUS_AFTER_A_POWER_FAILURE: 2,
  OVERLOAD_SAFETY_SWITCH: 3,
  POWER_LOAD_FOR_VIOLET_COLOR: 40
}

export default FibaroFgwpe102zw5SettingPanel
