'use strict'

/* global $, noUiSlider, wNumb */
import PropTypes from 'prop-types'
import React from 'react'
import { Preloader, Select } from 'react-materialize'

class BaseSettingPanel extends React.Component {
  constructor (props, configurationsToHandle = {}) {
    super(props)

    this._configurationsKeys = Object.values(configurationsToHandle) || []
    this._alarmKeys = null
    this._alarmMapper = null
    this._sliders = {}
    this._supports = {
      batteryLevelSupport: false,
      binarySwitchSupport: false,
      alarmSupport: false
    }

    this.socket = props.privateSocket
    this.zwaveService = props.services()['asterism-plugin-zwave']
    this.mounted = false

    this.state = {
      configuration: Object.fromEntries(this._configurationsKeys.map((k) => [k, null])),
      panelReady: false
    }
  }

  withBatteryLevelSupport () {
    this.state.batteryPercent = 0
    this.state.batteryIcon = null
    this._supports.batteryLevelSupport = true
    return this
  }

  withBinarySwitchSupport (instancesCount = 1) {
    this.state.switchStates = (new Array(instancesCount)).fill(null)
    this._supports.binarySwitchSupport = instancesCount
    return this
  }

  withAlarmSupport (alarmMapper) {
    this._alarmKeys = Object.keys(alarmMapper)
    this._alarmMapper = alarmMapper
    this.state.alarms = {
      alarmMapper,
      alarmStatuses: Object.fromEntries(this._alarmKeys.map((k) => [k, 'Unknown']))
    }
    this._supports.alarmSupport = true
    return this
  }

  componentDidMount (stateToMerge = {}) {
    const pop = this.props.productObjectProxy

    this.socket.on('node-event-configuration-updated', (nodeId, confIndex, value) => {
      if (this.props.nodeId !== nodeId) return

      if (this.mounted) {
        if (this.state.configuration[confIndex] !== value) {
          this.setState({ configuration: { ...this.state.configuration, [confIndex]: value } })
        }
      }
    })

    if (this._supports.batteryLevelSupport) {
      this.socket.on('node-event-battery-level-changed', (nodeId, confIndex, value) => {
        if (this.props.nodeId !== nodeId) return

        if (this.mounted && this.state.batteryPercent !== value.value) {
          this.setState({ batteryPercent: Math.round(value.value) })
        }
      })
    }

    if (this._supports.binarySwitchSupport) {
      this.socket.on('node-event-binary-switch-changed', (nodeId, value) => {
        if (this.props.nodeId !== nodeId) return

        if (this.mounted && this.state.switchStates[value.instance - 1] !== value.value) {
          const switchStates = [...this.state.switchStates]
          switchStates[value.instance - 1] = value.value
          this.setState({ switchStates })
        }
      })
    }

    const state = {
      ...stateToMerge,
      panelReady: true
    }

    this._componentDidMountConfigurations(pop, state, (s) => {
      this._componentDidMountSupports(pop, s, (s2) => {
        this.setState(s2)
        this.mounted = true
        this.plugWidgets()
      })
    })
  }

  _componentDidMountConfigurations (pop, state, callback) {
    if (this._configurationsKeys.length > 0) {
      Promise.all(this._configurationsKeys.map((k) => pop.getConfiguration(k)))
        .then((configurationValues) => {
          state.configuration = Object.fromEntries(this._configurationsKeys.map((k, i) => [k, configurationValues[i]]))
          callback(state)
        })
        .catch(console.error)
    } else {
      callback(state)
    }
  }

  _componentDidMountSupports (pop, state, callback) {
    Promise.all([
      this._supports.batteryLevelSupport ? pop.batteryLevelGetPercent() : Promise.resolve(0),
      this._supports.batteryLevelSupport ? pop.batteryLevelGetIcon() : Promise.resolve(null),
      this._supports.binarySwitchSupport > 0 ? pop.binarySwitchGetState(1) : Promise.resolve(null),
      this._supports.binarySwitchSupport > 1 ? pop.binarySwitchGetState(2) : Promise.resolve(null),
      this._supports.binarySwitchSupport > 2 ? pop.binarySwitchGetState(3) : Promise.resolve(null),
      this._supports.binarySwitchSupport > 3 ? pop.binarySwitchGetState(4) : Promise.resolve(null) // XXX : can support more...
    ])
      .then(([batteryPercent, batteryIcon, switchState1, switchState2, switchState3, switchState4]) => {
        if (this._supports.batteryLevelSupport) {
          state.batteryPercent = batteryPercent
          state.batteryIcon = batteryIcon
        }

        if (this._supports.binarySwitchSupport) {
          state.switchStates = [switchState1]
          if (this._supports.binarySwitchSupport > 1) {
            state.switchStates[1] = switchState2
          }
          if (this._supports.binarySwitchSupport > 2) {
            state.switchStates[2] = switchState3
          }
          if (this._supports.binarySwitchSupport > 3) {
            state.switchStates[3] = switchState4
          }
        }

        if (this._supports.alarmSupport) {
          Promise.all(this._alarmKeys.map((k) => pop.alarmIsOn(k)))
            .then((alarmStatuses) => {
              state.alarms = {
                alarmMapper: this._alarmMapper,
                alarmStatuses: Object.fromEntries(this._alarmKeys.map((k, i) => [k, alarmStatuses[i]]))
              }
              callback(state)
            })
            .catch(console.error)
        } else {
          callback(state)
        }
      })
      .catch(console.error)
  }

  componentDidUpdate (prevProps, prevState) {
    this.plugWidgets()
  }

  componentWillUnmount () {
    this.mounted = false
  }

  plugWidgets () {}

  plugConfigurationSlider (domId, configurationIndex, defaultValue, sliderParamOverrides, onChange) {
    const domSlider = $(`#${domId}-${this.props.nodeId}`)[0]
    if (domSlider) {
      let startValue = configurationIndex ? this.state.configuration[configurationIndex] : defaultValue
      if (startValue === undefined || startValue === null) {
        startValue = defaultValue
      }
      if (!this._sliders[domId] || !domSlider.noUiSlider) {
        this._sliders[domId] = noUiSlider.create(domSlider, {
          start: startValue,
          connect: true,
          step: 1,
          animate: true,
          range: {
            min: [0, 1],
            max: [100]
          },
          format: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            stepped: true,
            density: 4,
            format: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] }),
          behaviour: 'tap-drag',
          orientation: 'horizontal',
          ...sliderParamOverrides
        })

        this._sliders[domId].on('change', onChange)
      } else {
        this._sliders[domId].set(startValue)
      }
    }
  }

  render () {
    return (
      <div className='valign-wrapper centered-loader'>
        <div>
          <Preloader size='big' />
        </div>
      </div>
    )
  }

  renderListConfigurationAsSelect (configurationKey, possibleValues, props = {}) {
    const actualValue = Number.isInteger(this.state.configuration[configurationKey])
      ? this.state.configuration[configurationKey]
      : possibleValues.indexOf(this.state.configuration[configurationKey])

    return (
      <Select
        s={props.s || 12}
        m={props.m || 6}
        label={props.label}
        onChange={(v) => BaseSettingPanel.prototype.changeConfiguration.bind(this)(configurationKey, v, parseInt)}
        value={`${actualValue}`}
      >
        <option disabled>{props.label}</option>
        {possibleValues.map((label, i) => (<option key={i} value={i}>{label}</option>))}
      </Select>
    )
  }

  changeConfiguration (index, valueOrFormElement, transformer = (v) => v) {
    const value = (valueOrFormElement && valueOrFormElement.currentTarget)
      ? valueOrFormElement.currentTarget.value
      : valueOrFormElement

    this.props.productObjectProxy.setConfiguration(index, transformer(value))
      .then(() => {
        this.setState({ configuration: { ...this.state.configuration, [index]: transformer(value) } })
      })
      .catch(console.error)
  }

  invertBinarySwitchState (instance = 1) {
    if (!Number.isInteger(instance)) {
      instance = 1
    }
    this.props.productObjectProxy.binarySwitchInvert(instance).catch(console.error)
  }

  configurationValueToBitmask (index, size) {
    const value = this.state.configuration[index]
    return [...Array(size)].map((x, i) => !!(value >> i & 1))
  }

  changeConfigurationBitmask (index, size, position, valueOrFormElement, transformer = (v) => !!v) {
    const value = (valueOrFormElement && valueOrFormElement.currentTarget)
      ? valueOrFormElement.currentTarget.value
      : valueOrFormElement

    const bitmask = this.configurationValueToBitmask(index, size)
    bitmask[position] = transformer(value)

    const newBitmask = bitmask.reverse().reduce((res, x) => res << 1 | x, 0)
    this.changeConfiguration(index, newBitmask)
  }
}

BaseSettingPanel.propTypes = {
  serverStorage: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  localStorage: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  privateSocket: PropTypes.object.isRequired,
  productObjectProxy: PropTypes.object.isRequired,
  nodeId: PropTypes.number.isRequired
}

export default BaseSettingPanel
