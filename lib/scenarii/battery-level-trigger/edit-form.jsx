'use strict'

/* global $, noUiSlider, wNumb */
import PropTypes from 'prop-types'
import React from 'react'
import { Select, Preloader, Row } from 'react-materialize'
import uuid from 'uuid'

class ZwaveBatteryLevelTriggerEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      nodeIds: [],
      limit: props.instance.data.limit || 10
    }

    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this.zwaveService.getNodesByProvidedFunctions(['batteryLevelGetPercent'])
    .then((nodes) => {
      if (this._mounted) {
        this.setState({
          compatibleNodes: nodes.length ? nodes : [{ nodeid: 0, name: 'No compatible device available' }],
          ready: true
        })
        if (nodes.length === 1) {
          this.props.instance.data.nodeIds[0] = nodes[0].nodeid
          this.nameChange()
          this.setState({
            nodeIds: this.props.instance.data.nodeIds
          })
        }
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
    const domSlider = $(`#triggering-battery-level-slider-${this.props.instance.instanceId}`)[0]
    if (domSlider) {
      if (!this._slider || !domSlider.noUiSlider) {
        this._slider = noUiSlider.create(domSlider, {
          start: this.props.instance.data.limit || 10,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0],
            'max': [100]
          },
          format: wNumb({
            decimals: 1
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            stepped: true,
            density: 4,
            filter: v => v % 10 ? 0 : 1
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider.on('change', this.limitChanged.bind(this))
      } else {
        this._slider.set(this.props.instance.data.limit || 10)
      }
    }
  }

  render () {
    const { compatibleNodes, ready, limit } = this.state
    const { instance } = this.props

    return ready ? (
      <Row className='section card form'>
        {compatibleNodes.length > 0 ? instance.data.nodeIds.map((nodeId, idx) => (
          <Select key={uuid.v4()} s={12} m={6} l={4} label={`Z-wave device #${idx + 1}`} icon='battery_full'
            onChange={this.nodeChanged.bind(this, idx)} value={nodeId}>
            {compatibleNodes.map((node, i) => (
              <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
            ))}
            <option key={uuid.v4()} value='0'>(Remove it)</option>
          </Select>
        )) : (
          <div>Compatible devices not found on the network.</div>
        )}
        <Select key={uuid.v4()} s={12} m={6} l={4}
          label={`Z-wave device #${instance.data.nodeIds.length + 1}`} icon='battery_full'
          onChange={this.nodeChanged.bind(this, instance.data.nodeIds.length)} value=''>
          <option key={uuid.v4()} value='' disabled>(Choose one to add)</option>
          {compatibleNodes.map((node, idx) => (
            <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
          ))}
        </Select>

        <Select s={12} m={5} label='Way' icon='swap_vert' onChange={this.wayChanged.bind(this)}
          value={instance.data.way || 'increasing'}>
          <option key='increasing' value='increasing'>Upward (increasing)</option>
          <option key='decreasing' value='decreasing'>Downward (decreasing)</option>
        </Select>

        <div className='col s12'>Triggers when (one of) the device(s)' battery level crosses the limit {instance.data.way === 'increasing' ? 'upward' : 'downward'} of {limit}% :</div>
        <div className='col s12 slider'>
          <div id={`triggering-battery-level-slider-${instance.instanceId}`} />
        </div>
      </Row>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }

  nodeChanged (index, event) {
    const newNodeId = parseInt(event.currentTarget.value)
    if (newNodeId > 0) {
      this.props.instance.data.nodeIds[index] = newNodeId
    } else {
      const nodeIds = this.props.instance.data.nodeIds.filter((nodeId, idx) => idx !== index)
      if (nodeIds.length > 0) { // avoid to remove all nodes (1 min needed)
        this.props.instance.data.nodeIds = nodeIds
      }
    }
    this.setState({
      nodeIds: this.props.instance.data.nodeIds
    })
    this.nameChange()
  }

  wayChanged (event) {
    this.props.instance.data.way = event.currentTarget.value
    this.setState({
      way: this.props.instance.data.way
    })
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
    if (this.props.instance.data.nodeIds.length === 0) {
      this.props.instance.data.name = 'Misconfigured battery level trigger'
      return
    }
    const nodeNames = this.state.compatibleNodes
      .filter((node) => this.props.instance.data.nodeIds.includes(node.nodeid))
      .map((node) => `"${node.name}"`)
    this.props.instance.data.name = nodeNames.join(', ')
    this.props.highlightCloseButton()
  }
}

ZwaveBatteryLevelTriggerEditForm.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveBatteryLevelTriggerEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveBatteryLevelTriggerEditForm.label = 'Z-wave battery level trigger'

export default ZwaveBatteryLevelTriggerEditForm
