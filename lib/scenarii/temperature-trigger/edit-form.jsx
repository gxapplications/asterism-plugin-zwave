'use strict'

/* global $, noUiSlider, wNumb */
import PropTypes from 'prop-types'
import React from 'react'
import { Select, Preloader, Row } from 'react-materialize'
import uuid from 'uuid'

const displayPips = (v) => {
  const valInt = parseInt(v)
  if (v != valInt) {
    return ''
  }
  return ([-200, -100, -40, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 60, 100, 200].includes(valInt)) ? valInt : ''
}

class ZwaveTemperatureTriggerEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      limit: props.instance.data.limit > -201 ? props.instance.data.limit : 30
    }

    this._mounted = false
  }

  _getUnitForNode (node) {
    return this.zwaveService.getProductObjectProxyForNodeId(node.nodeid, node.meta)
    .then((prodObjProxy) => prodObjProxy.sensorMultiLevelGetUnits ? prodObjProxy.sensorMultiLevelGetUnits() : null)
    .then((unit) => [node, unit])
  }

  componentDidMount () {
    this._mounted = true
    this.zwaveService.getNodesByProvidedFunctions(['sensorMultiLevelGetValue', 'sensorMultiLevelGetHistory', 'sensorMultiLevelGetUnits'])
    .then((nodes) => {
      if (this._mounted) {
        Promise.all(nodes.map(this._getUnitForNode.bind(this)))
        .then((nodesAndUnits) => {
          const compatibleNodes = nodesAndUnits.filter(([node, unit]) => unit === '°C').map(([node, unit]) => node)
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
    const domSlider = $(`#triggering-temperature-slider-${this.props.instance.data.nodeId}`)[0]
    if (domSlider) {
      if (!this._slider || !domSlider.noUiSlider) {
        this._slider = noUiSlider.create(domSlider, {
          start: this.props.instance.data.limit > -201 ? this.props.instance.data.limit : 30,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [-200, 25],
            '5%': [-100, 10],
            '11%': [-40, 2],
            '18%': [-20, 1],
            '25%': [-10, 0.5],
            '38%': [0, 0.5],
            '51%': [10, 0.5],
            '64%': [20, 0.5],
            '76%': [30, 1],
            '83%': [40, 2],
            '91%': [60, 10],
            '95%': [100, 25],
            'max': [200]
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
          tooltips: wNumb({ decimals: 1 }),
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider.on('change', this.limitChanged.bind(this))
      } else {
        this._slider.set(this.props.instance.data.limit > -201 ? this.props.instance.data.limit : 30)
      }
    }
  }

  render () {
    const { compatibleNodes, ready, limit } = this.state
    const { instance } = this.props

    return ready ? (
      <Row className='section card form'>
        <br className='col s12 m12 l12' key={uuid.v4()} />
        {compatibleNodes.length > 0 ? (
          <Select s={12} m={7} label='Z-wave device' icon='iso'
            onChange={this.nodeChanged.bind(this)} value={`${instance.data.nodeId}`}>
            {compatibleNodes.map((node, i) => (
              <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
            ))}
          </Select>
        ) : (
          <div>Compatible devices not found on the network.</div>
        )}

        <div className='col s12 m12 l12' key={uuid.v4()}>&nbsp;</div>
        <Select s={12} label='Way' icon='swap_vert' onChange={this.wayChanged.bind(this)}
          value={instance.data.way || 'increasing'}>
          <option key='increasing' value='increasing'>Upward (increasing)</option>
          <option key='decreasing' value='decreasing'>Downward (decreasing)</option>
        </Select>

        <div className='col s12 m12 l12' key={uuid.v4()}>&nbsp;</div>
        <div className='col s12'>Triggers when temperature crosses the limit {instance.data.way === 'increasing' ? 'upward' : 'downward'} of {limit}°C:</div>
        <div className='col s12 slider'>
          <div id={`triggering-temperature-slider-${instance.data.nodeId}`} />
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

  wayChanged (event) {
    this.props.instance.data.way = event.currentTarget.value
    this.nameChange()
  }

  limitChanged (value) {
    this.props.instance.data.limit = parseFloat(value[0])
    this.setState({
      limit: this.props.instance.data.limit
    })
    this.nameChange()
  }

  nameChange () {
    if (!this.props.instance.data.nodeId) {
      this.props.instance.data.name = 'Misconfigured temperature trigger'
      return
    }
    const node = this.state.compatibleNodes.find((n) => n.nodeid === this.props.instance.data.nodeId)
    this.props.instance.data.name = node.name
    this.props.highlightCloseButton()
  }
}

ZwaveTemperatureTriggerEditForm.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveTemperatureTriggerEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveTemperatureTriggerEditForm.label = 'Z-wave temperature trigger'

export default ZwaveTemperatureTriggerEditForm
