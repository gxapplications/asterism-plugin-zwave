'use strict'

/* global $, noUiSlider, wNumb */
import PropTypes from 'prop-types'
import React from 'react'
import { Input, Preloader, Row } from 'react-materialize'
import uuid from 'uuid'

const displayPips = (v) => {
  const valInt = parseInt(v)
  if (v != valInt) {
    return ''
  }
  return ([-200, -100, -40, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 60, 100, 200].includes(valInt)) ? valInt : ''
}

class ZwaveTemperatureConditionEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      nodeIds: [],
      limit: props.instance.data.limit > -201 ? props.instance.data.limit : 30,
      limit2: props.instance.data.limi2 > -201 ? props.instance.data.limi2 : 10,
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
    .then((nodes) => Promise.all(nodes.map(([n, p]) => p.sensorMultiLevelGetUnits().then(u => u === '°C' ? n : false))))
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
    const domSlider = $(`#conditioning-temperature-slider-${this.props.instance.instanceId}`)[0]
    if (this._mounted && domSlider) {
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

    const domSlider2 = $(`#conditioning-temperature-double-slider-${this.props.instance.instanceId}`)[0]
    if (this._mounted && domSlider2) {
      if (!this._slider2 || !domSlider2.noUiSlider) {
        this._slider2 = noUiSlider.create(domSlider2, {
          start: [
            this.props.instance.data.limit2 > -201 ? this.props.instance.data.limit2 : 10,
            this.props.instance.data.limit > -201 ? this.props.instance.data.limit : 30
          ],
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
          tooltips: [wNumb({ decimals: 1 }), wNumb({ decimals: 1 })],
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider2.on('change', this.limitChanged.bind(this))
      } else {
        this._slider2.set([
          this.props.instance.data.limit2 > -201 ? this.props.instance.data.limit2 : 10,
          this.props.instance.data.limit > -201 ? this.props.instance.data.limit : 30
        ])
      }
    }
  }

  render () {
    const { compatibleNodes, ready, limit, limit2 } = this.state
    const { instance } = this.props

    const aggregation = (instance.data.aggregation === 'every') ?
      'every (each of them) device(s)\'' :
      ((instance.data.aggregation === 'average') ? 'average of all device(s)\'' : 'at least one device\'s')

    return ready ? (
      <Row className='section card form'>
        {compatibleNodes.length > 0 ? instance.data.nodeIds.map((nodeId, idx) => (
          <Input key={uuid.v4()} s={12} m={6} l={4} label={`Z-wave device #${idx + 1}`} type='select' icon='iso'
            onChange={this.nodeChanged.bind(this, idx)} defaultValue={nodeId}>
            {compatibleNodes.map((node, i) => (
              <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
            ))}
            <option key={uuid.v4()} value='0'>(Remove it)</option>
          </Input>
        )) : (
          <div>Compatible devices not found on the network.</div>
        )}
        <Input key={uuid.v4()} s={12} m={6} l={4}
          label={`Z-wave device #${instance.data.nodeIds.length + 1}`} type='select' icon='iso'
          onChange={this.nodeChanged.bind(this, instance.data.nodeIds.length)} defaultValue=''>
          <option key={uuid.v4()} value='0'>(Choose one to add)</option>
          {compatibleNodes.map((node, idx) => (
            <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
          ))}
        </Input>

        <Input s={12} m={5} label='Aggregation' type='select' icon='functions' onChange={this.aggregationChanged.bind(this)}
          defaultValue={instance.data.aggregation || 'any'}>
          <option key='any' value='any'>Any (one of them)</option>
          <option key='every' value='every'>Every (each of them)</option>
          <option key='average' value='average'>Average</option>
        </Input>

        <Input s={12} m={5} label='Operator' type='select' icon='swap_vert' onChange={this.operatorChanged.bind(this)}
          defaultValue={instance.data.operator || 'above'}>
          <option key='below' value='below'>Below</option>
          <option key='above' value='above'>Above</option>
          <option key='between' value='between'>Between</option>
        </Input>

        {instance.data.operator === 'between' ? (
          <div className='col s12'>Pass when {aggregation} temperature is between {limit2}°C and {limit}°C :</div>
        ) : (
          <div className='col s12'>Pass when {aggregation} temperature is {instance.data.operator} {limit}°C :</div>
        )}

        <div className='col s12 slider'>
          {instance.data.operator === 'between' && (
              <div id={`conditioning-temperature-double-slider-${instance.instanceId}`} />
          )}
          {instance.data.operator !== 'between' && (
              <div id={`conditioning-temperature-slider-${instance.instanceId}`} />
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
      const [min, max] = values.map((v) => parseFloat(v)).sort((a, b) => a - b)
      this.props.instance.data.limit2 = min
      this.props.instance.data.limit = max
    } else {
      this.props.instance.data.limit = parseFloat(values[0])
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
      this.props.instance.data.name = 'Misconfigured Z-wave Temperature condition'
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
        case 'average':
          aggregatedNames = `Average of [${nodeNames.join('+')}]`
          break
      }
    }

    switch (this.props.instance.data.operator) {
      case 'below':
        this.props.instance.data.name = `${aggregatedNames} ≤ ${this.props.instance.data.limit}°C`
        break
      case 'above':
      default:
        this.props.instance.data.name = `${aggregatedNames} ≥ ${this.props.instance.data.limit}°C`
        break
      case 'between':
        this.props.instance.data.name = `${this.props.instance.data.limit2}°C ≤ ${aggregatedNames} ≤ ${this.props.instance.data.limit}°C`
        break
    }

    this.props.highlightCloseButton()
  }
}

ZwaveTemperatureConditionEditForm.propTypes = {
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveTemperatureConditionEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveTemperatureConditionEditForm.label = 'Z-wave Temperature condition'

export default ZwaveTemperatureConditionEditForm
