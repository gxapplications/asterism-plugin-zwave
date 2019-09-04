'use strict'

/* global $, noUiSlider, wNumb */
import PropTypes from 'prop-types'
import React from 'react'
import { Select, Preloader, Row } from 'react-materialize'
import uuid from 'uuid'

const displayPips = (v) => {
  const value = (v >= 5) ? `${v}`.split('.')[0] : `${v}`
  return (['0.1', '1.0', '5', '10', '50', '100', '500', '1000', '2000'].includes(value)) ? value : ''
}

class ZwaveEnergyConsumptionLimitTriggerEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      limit: props.instance.data.limit || 50,
      unit: props.instance.data.unit || 'kWh'
    }

    this._mounted = false
  }

  _getUnitForNode (node) {
    return this.zwaveService.getProductObjectProxyForNodeId(node.nodeid, node.meta)
    .then((prodObjProxy) => prodObjProxy.meterGetUnits ? prodObjProxy.meterGetUnits() : null)
    .then((unit) => [node, unit])
  }

  componentDidMount () {
    this._mounted = true
    this.zwaveService.getNodesByProvidedFunctions(['meterGetLastValue', 'meterGetAllValues', 'meterGetUnits'])
    .then((nodes) => {
      if (this._mounted) {
        Promise.all(nodes.map(this._getUnitForNode.bind(this)))
        .then((nodesAndUnits) => {
          const compatibleNodes = nodesAndUnits.filter(([node, unit]) => unit === 'kWh').map(([node, unit]) => node)
          this.setState({
            compatibleNodes: compatibleNodes.length ? compatibleNodes : [{ nodeid: 0, name: 'No compatible device available' }],
            ready: true
          })
          if (compatibleNodes.length === 1) {
            this.props.instance.data.nodeId = compatibleNodes[0].nodeid
            this.nameChange()
          }
        })
      }
    })
    .catch(console.error)
    this.plugWidgets()
  }

  componentWillUnmount () {
    this._mounted = false
  }

  componentDidUpdate (prevProps, prevState) {
    this.plugWidgets()
  }

  plugWidgets () {
    const domSlider = $(`#triggering-limit-consumption-slider-${this.props.instance.data.nodeId}`)[0]
    if (domSlider) {
      if (!this._slider || !domSlider.noUiSlider) {
        this._slider = noUiSlider.create(domSlider, {
          start: this.props.instance.data.limit || 50,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0.1, 0.1],
            '11%': [1, 0.5],
            '25%': [5, 1],
            '34%': [10, 5],
            '49%': [50, 10],
            '58%': [100, 50],
            '72%': [500, 100],
            '82%': [1000, 100],
            'max': [2000]
          },
          format: wNumb({
            decimals: 1
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            stepped: true,
            density: 4,
            format: wNumb({ decimals: 1, edit: displayPips })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => (v > 5) ? `${v}`.split('.')[0] : v }),
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider.on('change', this.limitChanged.bind(this))
      } else {
        this._slider.set(this.props.instance.data.limit || 50)
      }
    }
  }

  render () {
    const { compatibleNodes, ready, limit } = this.state
    const { instance } = this.props

    const unit = (instance.data.unit === 'kWh') ? 'kWh' : '¤'

    return ready ? (
      <Row className='section card form'>
        <br className='col s12 m12 l12' key={uuid.v4()} />
        {compatibleNodes.length > 0 ? (
          <Select s={12} m={7} label='Z-wave device' icon='ev_station'
            onChange={this.nodeChanged.bind(this)} value={`${instance.data.nodeId}`}>
            {compatibleNodes.map((node, i) => (
              <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
            ))}
          </Select>
        ) : (
          <div>Compatible devices not found on the network.</div>
        )}

        <div className='col s12 m12 l12' key={uuid.v4()}>&nbsp;</div>
        <Select s={12} label='Unit' icon='euro_symbol' onChange={this.unitChanged.bind(this)}
          value={instance.data.unit || 'kWh'}>
          <option key='kWh' value='kWh'>kWh</option>
          <option key='cost' value='cost'>Cost (¤)</option>
        </Select>

        <div className='col s12 m12 l12' key={uuid.v4()}>&nbsp;</div>
        <div className='col s12'>Triggers when device energy consumption crosses the limit of {limit}{unit}:</div>
        <div className='col s12 slider'>
          <div id={`triggering-limit-consumption-slider-${instance.data.nodeId}`} />
        </div>
      </Row>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }

  nodeChanged (event) {
    this.props.instance.data.nodeId = parseInt(event.currentTarget.value)
    this.nameChange()
  }

  limitChanged (value) {
    this.props.instance.data.limit = parseFloat(value[0])
    this.setState({
      limit: this.props.instance.data.limit
    })
    this.nameChange()
  }

  unitChanged (event) {
    this.props.instance.data.unit = event.currentTarget.value
    this.setState({
      unit: this.props.instance.data.unit
    })
    this.nameChange()
  }

  nameChange () {
    if (!this.props.instance.data.nodeId) {
      this.props.instance.data.name = 'Misconfigured energy consumption limit trigger'
      return
    }
    const node = this.state.compatibleNodes.find((n) => n.nodeid === this.props.instance.data.nodeId)
    const unit = this.props.instance.data.unit === 'kWh' ? 'kWh' : '¤'
    this.props.instance.data.name = `"${node.name}" ⇒ ${this.props.instance.data.limit}${unit}`
    this.props.highlightCloseButton()
  }
}

ZwaveEnergyConsumptionLimitTriggerEditForm.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveEnergyConsumptionLimitTriggerEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveEnergyConsumptionLimitTriggerEditForm.label = 'Z-wave energy consumption limit trigger'

export default ZwaveEnergyConsumptionLimitTriggerEditForm
