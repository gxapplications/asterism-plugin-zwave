'use strict'

/* global $, noUiSlider, wNumb */
import PropTypes from 'prop-types'
import React from 'react'
import { Input, Preloader, Row } from 'react-materialize'
import uuid from 'uuid'

const displayWatts = (watts) => {
  if (watts < 1000) {
    return `${Math.round(watts)}`
  }
  return `${Math.round(watts / 100) / 10}k`
}

class ZwaveInstantEnergyLimitTriggerEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      limit: props.instance.data.limit || 1000
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
          const compatibleNodes = nodesAndUnits.filter(([node, unit]) => unit === 'W').map(([node, unit]) => node)
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
    const domSlider = $(`#triggering-limit-power-slider-${this.props.instance.data.nodeId}`)[0]
    if (domSlider) {
      if (!this._slider || !domSlider.noUiSlider) {
        this._slider = noUiSlider.create(domSlider, {
          start: this.props.instance.data.limit || 1000,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [1],
            '5%': [5, 5],
            '23%': [50, 10],
            '34%': [100, 50],
            '56%': [500, 100],
            '70%': [1000, 500],
            '93%': [5000, 1000],
            'max': [8000]
          },
          format: wNumb({
            decimals: 1
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            stepped: true,
            density: 4,
            format: wNumb({ decimals: 1, edit: displayWatts })
          },
          tooltips: wNumb({ decimals: 1, edit: displayWatts }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider.on('change', this.limitChanged.bind(this))
      } else {
        this._slider.set(this.props.instance.data.limit || 1000)
      }
    }
  }

  render () {
    const { compatibleNodes, ready, limit } = this.state
    const { instance } = this.props

    return ready ? (
      <Row className='section card form'>
        {compatibleNodes.length > 0 ? (
          <Input s={12} m={7} label='Z-wave device' type='select' icon='offline_bolt'
            onChange={this.nodeChanged.bind(this)} defaultValue={instance.data.nodeId}>
            {compatibleNodes.map((node, i) => (
              <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
            ))}
          </Input>
        ) : (
          <div>Compatible devices not found on the network.</div>
        )}

        <Input s={12} m={5} label='Way' type='select' icon='swap_vert' onChange={this.wayChanged.bind(this)}
          defaultValue={instance.data.way || 'increasing'}>
          <option key='increasing' value='increasing'>Upward (increasing)</option>
          <option key='decreasing' value='decreasing'>Downward (decreasing)</option>
        </Input>

        <div className='col s12'>Triggers when device power crosses the limit {instance.data.way === 'increasing' ? 'upward' : 'downward'} of {limit}W:</div>
        <div className='col s12 slider'>
          <div id={`triggering-limit-power-slider-${instance.data.nodeId}`} />
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
    this.props.instance.data.limit = parseInt(value[0])
    this.setState({
      limit: this.props.instance.data.limit
    })
    this.nameChange()
  }

  nameChange () {
    if (!this.props.instance.data.nodeId) {
      this.props.instance.data.name = 'Misconfigured power limit trigger'
      return
    }
    const node = this.state.compatibleNodes.find((n) => n.nodeid === this.props.instance.data.nodeId)
    this.props.instance.data.name = node.name
    this.props.highlightCloseButton()
  }
}

ZwaveInstantEnergyLimitTriggerEditForm.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveInstantEnergyLimitTriggerEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveInstantEnergyLimitTriggerEditForm.label = 'Z-wave power limit trigger'

export default ZwaveInstantEnergyLimitTriggerEditForm
