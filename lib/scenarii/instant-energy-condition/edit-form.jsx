'use strict'

/* global $, noUiSlider, wNumb */
import PropTypes from 'prop-types'
import React from 'react'
import { Select, Preloader, Row } from 'react-materialize'
import uuid from 'uuid'

const displayPips = (v) => {
  const value = `${v}`.split('.')[0] || '0'
  return (['0', '5', '10', '30', '50', '250', '500', '750', '1000', '3000', '5000', '7000'].includes(value)) ? value : ''
}

class ZwaveInstantEnergyConditionEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      nodeIds: [],
      limit: props.instance.data.limit || 1000,
      limit2: props.instance.data.limit2 || 100,
      operator: props.instance.data.operator,
      aggregation: props.instance.data.aggregation
    }

    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this.zwaveService.getNodesByProvidedFunctions(['sensorMultiLevelGetValue', 'sensorMultiLevelGetUnits'])
    .then((nodes) => Promise.all(nodes.map(
      n => this.zwaveService.getProductObjectProxyForNodeId(n.nodeid, n.meta).then(p => [n, p])
    )))
    .then((nodes) => Promise.all(nodes.map(([n, p]) => p.sensorMultiLevelGetUnits().then(u => u === 'W' ? n : false))))
    .then((nodes) => {
      if (this._mounted) {
        nodes = nodes.filter(n => n !== false)
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
    const domSlider = $(`#conditioning-instant-energy-slider-${this.props.instance.instanceId}`)[0]
    if (this._mounted && domSlider) {
      if (!this._slider || !domSlider.noUiSlider) {
        this._slider = noUiSlider.create(domSlider, {
          start: this.props.instance.data.limit >= 0 ? this.props.instance.data.limit : 1000,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 2],
            '7%': [10, 5],
            '19%': [50, 25],
            '34%': [250, 50],
            '61%': [1000, 200],
            'max': [7000]
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
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider.on('change', this.limitChanged.bind(this))
      } else {
        this._slider.set(this.props.instance.data.limit >= 0 ? this.props.instance.data.limit : 1000)
      }
    }

    const domSlider2 = $(`#conditioning-instant-energy-double-slider-${this.props.instance.instanceId}`)[0]
    if (this._mounted && domSlider2) {
      if (!this._slider2 || !domSlider2.noUiSlider) {
        this._slider2 = noUiSlider.create(domSlider2, {
          start: [
            this.props.instance.data.limit2 >= 0 ? this.props.instance.data.limit2 : 100,
            this.props.instance.data.limit >= 0 ? this.props.instance.data.limit : 1000
          ],
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 2],
            '7%': [10, 5],
            '19%': [50, 25],
            '34%': [250, 50],
            '61%': [1000, 200],
            'max': [7000]
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
          tooltips: [wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] }), wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] })], // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider2.on('change', this.limitChanged.bind(this))
      } else {
        this._slider2.set([
          this.props.instance.data.limit2 >= 0 ? this.props.instance.data.limit2 : 100,
          this.props.instance.data.limit >= 0 ? this.props.instance.data.limit : 1000
        ])
      }
    }
  }

  render () {
    const { compatibleNodes, ready, limit, limit2 } = this.state
    const { instance } = this.props

    const aggregation = (instance.data.aggregation === 'every') ?
      'every (each of them) device(s)\'' :
      ((instance.data.aggregation === 'sum') ? 'sum of all device(s)\'' : 'at least one device\'s')

    return ready ? (
      <Row className='section card form'>
        <br className='col s12 m12 l12' key={uuid.v4()} />
        {compatibleNodes.length > 0 ? instance.data.nodeIds.map((nodeId, idx) => (
          <Select key={uuid.v4()} s={12} m={6} l={4} label={`Z-wave device #${idx + 1}`} icon='offline_bolt'
            onChange={this.nodeChanged.bind(this, idx)} value={`${nodeId}`}>
            {compatibleNodes.map((node, i) => (
              <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
            ))}
            <option key={uuid.v4()} value='0'>(Remove it)</option>
          </Select>
        )) : (
            <div>Compatible devices not found on the network.</div>
        )}
        <Select key={uuid.v4()} s={12} m={6} l={4}
          label={`Z-wave device #${instance.data.nodeIds.length + 1}`} icon='offline_bolt'
          onChange={this.nodeChanged.bind(this, instance.data.nodeIds.length)} value=''>
          <option key={uuid.v4()} value='' disabled>(Choose one to add)</option>
          {compatibleNodes.map((node, idx) => (
            <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
          ))}
        </Select>

        <div className='col s12 m12 l12' key={uuid.v4()}>&nbsp;</div>
        <Select s={12} label='Aggregation' icon='functions' onChange={this.aggregationChanged.bind(this)}
          value={instance.data.aggregation || 'any'}>
          <option key='any' value='any'>Any (one of them)</option>
          <option key='every' value='every'>Every (each of them)</option>
          <option key='sum' value='sum'>Sum of each</option>
        </Select>

        <div className='col s12 m12 l12' key={uuid.v4()}>&nbsp;</div>
        <Select s={12} label='Operator' icon='swap_vert' onChange={this.operatorChanged.bind(this)}
          value={instance.data.operator || 'above'}>
          <option key='below' value='below'>Below</option>
          <option key='above' value='above'>Above</option>
          <option key='between' value='between'>Between</option>
        </Select>

        <div className='col s12 m12 l12' key={uuid.v4()}>&nbsp;</div>
        {instance.data.operator === 'between' ? (
          <div className='col s12'>Pass when {aggregation} instant energy level is between {limit2}W and {limit}W :</div>
        ) : (
          <div className='col s12'>Pass when {aggregation} instant energy level is {instance.data.operator} {limit}W :</div>
        )}

        <div className='col s12 slider'>
          {instance.data.operator === 'between' && (
              <div id={`conditioning-instant-energy-double-slider-${instance.instanceId}`} />
          )}
          {instance.data.operator !== 'between' && (
              <div id={`conditioning-instant-energy-slider-${instance.instanceId}`} />
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

  aggregationChanged (event) {
    this.props.instance.data.aggregation = event.currentTarget.value
    this.setState({
      aggregation: this.props.instance.data.aggregation
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
      this.props.instance.data.name = 'Misconfigured Z-wave Instant energy condition'
      this.props.highlightCloseButton()
      return
    }
    const nodeNames = this.state.compatibleNodes
    .filter((node) => this.props.instance.data.nodeIds.includes(node.nodeid))
    .map((node) => `"${node.name}"`)

    let aggregatedNames = nodeNames[0] // only one node case

    if (nodeNames.length > 1) {
      switch (this.props.instance.data.aggregation) {
        case 'any':
          aggregatedNames = `At least one of [${nodeNames.join('|')}]`
          break
        case 'every':
          aggregatedNames = `Each of [${nodeNames.join('&')}]`
          break
        case 'sum':
          aggregatedNames = `Sum of [${nodeNames.join('+')}]`
          break
      }
    }

    switch (this.props.instance.data.operator) {
      case 'below':
        this.props.instance.data.name = `${aggregatedNames} ≤ ${this.props.instance.data.limit}W`
        break
      case 'above':
      default:
        this.props.instance.data.name = `${aggregatedNames} ≥ ${this.props.instance.data.limit}W`
        break
      case 'between':
        this.props.instance.data.name = `${this.props.instance.data.limit2}W ≤ ${aggregatedNames} ≤ ${this.props.instance.data.limit}W`
        break
    }

    this.props.highlightCloseButton()
  }
}

ZwaveInstantEnergyConditionEditForm.propTypes = {
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveInstantEnergyConditionEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveInstantEnergyConditionEditForm.label = 'Z-wave Instant energy condition'

export default ZwaveInstantEnergyConditionEditForm
