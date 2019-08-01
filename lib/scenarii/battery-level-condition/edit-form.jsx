'use strict'

/* global $, noUiSlider, wNumb */
import PropTypes from 'prop-types'
import React from 'react'
import { Select, Preloader, Row } from 'react-materialize'
import uuid from 'uuid'

class ZwaveBatteryLevelConditionEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      nodeIds: [],
      limit: props.instance.data.limit || 10,
      limit2: props.instance.data.limit2 || 0,
      operator: props.instance.data.operator
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
    const domSlider = $(`#conditioning-battery-level-slider-${this.props.instance.instanceId}`)[0]
    if (this._mounted && domSlider) {
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

    const domSlider2 = $(`#conditioning-battery-level-double-slider-${this.props.instance.instanceId}`)[0]
    if (this._mounted && domSlider2) {
      if (!this._slider2 || !domSlider2.noUiSlider) {
        this._slider2 = noUiSlider.create(domSlider2, {
          start: [this.props.instance.data.limit2 || 0, this.props.instance.data.limit || 10],
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
          tooltips: [wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] }), wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] })], // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider2.on('change', this.limitChanged.bind(this))
      } else {
        this._slider2.set([this.props.instance.data.limit2 || 0, this.props.instance.data.limit || 10])
      }
    }
  }

  render () {
    const { compatibleNodes, ready, limit, limit2, operator } = this.state
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

        <Select s={12} m={5} label='Operator' icon='swap_vert' onChange={this.operatorChanged.bind(this)}
               value={instance.data.operator || 'below'}>
          <option key='below' value='below'>Below</option>
          <option key='above' value='above'>Above</option>
          <option key='between' value='between'>Between</option>
        </Select>

        {instance.data.operator === 'between' ? (
          <div className='col s12'>Pass when (one of) the device(s)' battery level is between {limit}% and {limit2}% :</div>
        ) : (
          <div className='col s12'>Pass when (one of) the device(s)' battery level is {instance.data.operator === 'below' ? 'below' : 'above'} {limit}% :</div>
        )}

        <div className='col s12 slider'>
          {operator === 'between' && (
            <div id={`conditioning-battery-level-double-slider-${instance.instanceId}`} />
          )}
          {operator !== 'between' && (
            <div id={`conditioning-battery-level-slider-${instance.instanceId}`} />
          )}
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

  operatorChanged (event) {
    this.props.instance.data.operator = event.currentTarget.value
    this.setState({
      operator: this.props.instance.data.operator
    })
    this.nameChange()
  }

  limitChanged (values) {
    if (this.props.instance.data.operator === 'between') {
      const [min, max] = values.map((v) => parseInt(v, 10)).sort((a, b) => a - b)
      this.props.instance.data.limit2 = min
      this.props.instance.data.limit = max
    } else {
      this.props.instance.data.limit = parseInt(values[0], 10)
      this.props.instance.data.limit2 = 0
    }
    this.setState({
      limit: this.props.instance.data.limit,
      limit2: this.props.instance.data.limit2
    })
    this.nameChange()
  }

  nameChange () {
    if (this.props.instance.data.nodeIds.length === 0) {
      this.props.instance.data.name = 'Misconfigured battery level condition'
      this.props.highlightCloseButton()
      return
    }
    const nodeNames = this.state.compatibleNodes
        .filter((node) => this.props.instance.data.nodeIds.includes(node.nodeid))
        .map((node) => `"${node.name}"`)

    switch (this.props.instance.data.operator) {
      case 'below':
      default:
        this.props.instance.data.name = `[${nodeNames.join('|')}] ≤ ${this.props.instance.data.limit}%`
        break
      case 'above':
        this.props.instance.data.name = `[${nodeNames.join('|')}] ≥ ${this.props.instance.data.limit}%`
        break
      case 'between':
        this.props.instance.data.name = `${this.props.instance.data.limit2}% ≤ [${nodeNames.join('|')}] ≤ ${this.props.instance.data.limit}%`
        break
    }

    this.props.highlightCloseButton()
  }
}

ZwaveBatteryLevelConditionEditForm.propTypes = {
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveBatteryLevelConditionEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveBatteryLevelConditionEditForm.label = 'Z-wave Battery level condition'

export default ZwaveBatteryLevelConditionEditForm
