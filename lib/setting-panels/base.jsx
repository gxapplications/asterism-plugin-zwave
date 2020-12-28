'use strict'

/* global $, noUiSlider, wNumb */
import PropTypes from 'prop-types'
import React from 'react'
import { Preloader, Select } from 'react-materialize'

class BaseSettingPanel extends React.Component {
  constructor (props, configurationsToHandle = {}) {
    super(props)

    this._configurationsKeys = Object.values(configurationsToHandle) || []
    this._sliders = {}
    this._supports = {
      batteryLevelSupport: false
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

  componentDidMount (stateToMerge = {}) {
    const pop = this.props.productObjectProxy

    if (this._supports.batteryLevelSupport) {
      this.socket.on('node-event-battery-level-changed', (nodeId, confIndex, value) => {
        if (this.props.nodeId !== nodeId) return

        if (this.mounted && this.state.batteryPercent !== value.value) {
          this.setState({ batteryPercent: Math.round(value.value) })
        }
      })
    }

    Promise.all(this._configurationsKeys.map((k) => pop.getConfiguration(k)))
    .then((configurationValues) => {
      const state = {
        ...stateToMerge,
        configuration: Object.fromEntries(this._configurationsKeys.map((k, i) => [k, configurationValues[i]])),
        panelReady: true
      }

      Promise.all([
        this._supports.batteryLevelSupport ? pop.batteryLevelGetPercent() : Promise.resolve(0),
        this._supports.batteryLevelSupport ? pop.batteryLevelGetIcon() : Promise.resolve(null)
      ])
      .then(([batteryPercent, batteryIcon]) => {
        if (this._supports.batteryLevelSupport) {
          state.batteryPercent = batteryPercent
          state.batteryIcon = batteryIcon
        }

        this.setState(state)

        this.mounted = true
        this.plugWidgets()
      })
      .catch(console.error)
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
      if (!this._sliders[domId] || !domSlider.noUiSlider) {
        this._sliders[domId] = noUiSlider.create(domSlider, {
          start: (this.state.configuration[configurationIndex]) || defaultValue,
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
        this._sliders[domId].set((this.state.configuration[configurationIndex]) || defaultValue)
      }
    }
  }

  render () {
    return (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
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
