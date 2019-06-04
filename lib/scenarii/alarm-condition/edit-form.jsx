'use strict'

/* global $, noUiSlider, wNumb */
import PropTypes from 'prop-types'
import React from 'react'
import { Select, Preloader, Row } from 'react-materialize'
import uuid from 'uuid'

class ZwaveAlarmConditionEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      events: this.props.instance.data.events || [],
      aggregation: this.props.instance.data.aggregation || 'any'
    }

    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this.zwaveService.getNodesByProvidedFunctions(['alarmGetSupportedLabels'])
    .then((nodes) => {
      if (this._mounted) {
        this.setState({
          compatibleNodes: nodes.length ? nodes : [{ nodeid: 0, name: 'No compatible device available' }],
          ready: true
        })
      }
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }

  render () {
    const { compatibleNodes, ready } = this.state
    const { instance } = this.props

    return ready ? (
      <Row className='section card form'>

        {compatibleNodes.length > 0 ? instance.data.events.map(({ nodeId, type, state }, idx) => {
          const alarmSupportedLabels = compatibleNodes.find((n) => n.nodeid === nodeId).meta.alarmSupportedLabels
          return [
            <Select key={uuid.v4()} s={12} m={6} l={6} label={`Z-wave device #${idx + 1}`} icon='notification_important'
              onChange={this.nodeChanged.bind(this, idx)} value={nodeId}>
              {compatibleNodes.map((node, i) => (
                <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
              ))}
              <option key={uuid.v4()} value='0'>(Remove it)</option>
            </Select>,
            <Select key={uuid.v4()} s={12} m={6} l={6} label='Alarm type'
              onChange={this.typeChanged.bind(this, idx, nodeId)} value={type}>
              {Object.entries(alarmSupportedLabels).filter(([i]) => i !== 'defaults').map(([i, data]) => (
                <option key={uuid.v4()} value={i}>{data.label}</option>
              ))}
            </Select>,
            <div key={uuid.v4()} className='col s4 offset-m1 m3 offset-l2 l2'>
              <input name={`state_choice_${idx}`} type='radio' value={true} id={`state_choice_${idx}_on`}
                onClick={this.stateChanged.bind(this, idx, true)} defaultChecked={state === true} />
              <label htmlFor={`state_choice_${idx}_on`}>ON</label>
            </div>,
            <div key={uuid.v4()} className='col s4 m3 l2'>
              <input name={`state_choice_${idx}`} type='radio' value={false} id={`state_choice_${idx}_off`}
                onClick={this.stateChanged.bind(this, idx, false)} defaultChecked={state === false} />
              <label htmlFor={`state_choice_${idx}_off`}>OFF</label>
            </div>,
            <div key={uuid.v4()} className='col s4 m3 l2'>
                <input name={`state_choice_${idx}`} type='radio' value={null} id={`state_choice_${idx}_undef`}
            onClick={this.stateChanged.bind(this, idx, null)} defaultChecked={state === null} />
            <label htmlFor={`state_choice_${idx}_undef`}>Unknown</label>
            </div>,
            <br className='col s12 m12 l12' key={uuid.v4()} />,
            <hr className='col s12 m12 l12' key={uuid.v4()} />
          ]
        }) : (
          <div>Compatible devices not found on the network.</div>
        )}

        <Select key={uuid.v4()} s={12} m={6} l={6}
          label={`Z-wave device #${instance.data.events.length + 1}`} icon='notification_important'
          onChange={this.nodeChanged.bind(this, instance.data.events.length)} value=''>
          <option key={uuid.v4()} value='' disabled>(Choose one to add)</option>
          {compatibleNodes.map((node, idx) => (
            <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
          ))}
        </Select>

        <Select s={12} m={6} l={6} label='Aggregation' icon='functions' onChange={this.aggregationChanged.bind(this)}
          value={instance.data.aggregation || 'any'}>
          <option key='any' value='any'>Any (one of them)</option>
          <option key='every' value='every'>Every (each of them)</option>
        </Select>
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
      const supportedLabels = this.state.compatibleNodes.find((n) => n.nodeid === newNodeId).meta.alarmSupportedLabels
      const defaultType = supportedLabels.defaults ? [supportedLabels.defaults, supportedLabels[supportedLabels.defaults]] : Object.entries(supportedLabels)[0]
      this.props.instance.data.events[index] = { nodeId: newNodeId, type: defaultType[0], state: true }
    } else {
      const events = this.props.instance.data.events.filter(({ nodeId }, idx) => idx !== index)
      if (events.length > 0) { // avoid to remove all nodes (1 min needed)
        this.props.instance.data.events = events
      }
    }
    this.setState({
      events: this.props.instance.data.events
    })
    this.nameChange()
  }

  typeChanged (index, nodeId, event) {
    const newType = parseInt(event.currentTarget.value)
    const supportedLabels = this.state.compatibleNodes.find((n) => n.nodeid === nodeId).meta.alarmSupportedLabels

    this.props.instance.data.events[index].type = newType
    this.props.instance.data.events[index].state = true
    this.setState({
      events: this.props.instance.data.events
    })
    this.nameChange()
  }

  stateChanged (index, value) {
    this.props.instance.data.events[index].state = value
    this.setState({
      events: this.props.instance.data.events
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

  nameChange () {
    if (this.props.instance.data.events.length === 0) {
      this.props.instance.data.name = 'Misconfigured alarm status condition'
      return
    }
    const nodeNames = this.props.instance.data.events.map(({ nodeId, type, state }) => {
      const alarmSupportedLabels = this.state.compatibleNodes.find((n) => n.nodeid === nodeId).meta.alarmSupportedLabels
      const typeName = alarmSupportedLabels[type].shortLabel || alarmSupportedLabels[type].label
      const nodeName = this.state.compatibleNodes.find((node) => node.nodeid === nodeId).name
      return `"${nodeName} (${typeName} ${state ? 'ON' : (state === false ? 'OFF' : 'Unknown')})"`
    }) || []
    const aggregator = this.props.instance.data.aggregation === 'every' ? ' & ' : ' | '
    const prefix = this.props.instance.data.aggregation === 'every' ? 'Each of' : 'At least one of'
    this.props.instance.data.name = nodeNames.length > 1 ? `${prefix} [${nodeNames.join(aggregator)}]` : nodeNames[0]
    this.props.highlightCloseButton()
  }
}

ZwaveAlarmConditionEditForm.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveAlarmConditionEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveAlarmConditionEditForm.label = 'Z-wave alarm condition'

export default ZwaveAlarmConditionEditForm
