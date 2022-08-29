'use strict'

/* global $, noUiSlider, wNumb */
import PropTypes from 'prop-types'
import React from 'react'
import { Select, Preloader, Row } from 'react-materialize'
import uuid from 'uuid'

class ZwaveAlarmTriggerEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      events: this.props.instance.data.events || []
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

        {compatibleNodes.length > 0 ? instance.data.events.map(({ nodeId, type, cases }, idx) => {
          const alarmSupportedLabels = compatibleNodes.find((n) => n.nodeid === nodeId).meta.alarmSupportedLabels
          const typeData = alarmSupportedLabels[type] || {}
          const casesData = typeData.cases
          return [
            <br className='col s12 m12 l12' key={uuid.v4()} />,
            <Select key={uuid.v4()} s={12} m={6} l={5} label={`Z-wave device #${idx + 1}`} icon='notification_important'
              onChange={this.nodeChanged.bind(this, idx)} value={`${nodeId}`}>
              {compatibleNodes.map((node, i) => (
                <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
              ))}
              <option key={uuid.v4()} value='0'>(Remove it)</option>
            </Select>,
            <Select key={uuid.v4()} s={12} m={6} l={5} label='Alarm type'
              onChange={this.typeChanged.bind(this, idx, nodeId)} value={`${type}`}>
              {Object.entries(alarmSupportedLabels).filter(([i]) => i !== 'defaults').map(([i, data]) => (
                <option key={uuid.v4()} value={i}>{data.label}</option>
              ))}
            </Select>,

            <div key={uuid.v4()} className='col s12 m12 l12'>
              {Object.entries(casesData).filter(([casIdx]) => casIdx !== 'defaults').map(([casIdx, label]) => (
                <label key={uuid.v4()} className='col'>
                  <input type="checkbox" className="filled-in" value={casIdx}
                    checked={cases.filter((cas) => cas == casIdx).length > 0}
                    onChange={this.casesChanged.bind(this, idx, nodeId, type, cases.filter((cas) => cas == casIdx).length === 0, label)} />
                  <span>{`${label} - `}</span>
                </label>
              ))}
            </div>,
            <br className='col s12 m12 l12' key={uuid.v4()} />,
            <hr className='col s12 m12 l12' key={uuid.v4()} />,
            <div className='col s12 m12 l12' key={uuid.v4()}>&nbsp;</div>
          ]
        }) : (
          <div>Compatible devices not found on the network.</div>
        )}

        <br className='col s12 m12 l12' key={uuid.v4()} />

        <Select key={uuid.v4()} s={12} m={6} l={6}
          label={`Z-wave device #${instance.data.events.length + 1}`} icon='notification_important'
          onChange={this.nodeChanged.bind(this, instance.data.events.length)} value=''>
          <option key={uuid.v4()} value='' disabled>(Choose one to add)</option>
          {compatibleNodes.map((node, idx) => (
            <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
          ))}
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
      this.props.instance.data.events[index] = { nodeId: newNodeId, type: defaultType[0], cases: defaultType[1].cases.defaults || [] }
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
    this.props.instance.data.events[index].cases = supportedLabels[newType].cases.defaults || []
    this.setState({
      events: this.props.instance.data.events
    })
    this.nameChange()
  }

  casesChanged (index, nodeId, type, check, label, event) {
    const caseToSet = event.currentTarget.value
    let cases = this.props.instance.data.events[index].cases
    if (check) {
      cases.push(caseToSet)
      cases.push(label)
    } else {
      cases = cases.filter((c) => c != caseToSet && c != label)
    }

    this.props.instance.data.events[index].cases = cases
    this.setState({
      events: this.props.instance.data.events
    })
    // this.nameChange()
    this.props.highlightCloseButton()
  }

  nameChange () {
    if (this.props.instance.data.events.length === 0) {
      this.props.instance.data.name = 'Misconfigured alarm trigger'
      return
    }
    const nodeNames = this.props.instance.data.events.map(({ nodeId, type, cases }) => {
      const alarmSupportedLabels = this.state.compatibleNodes.find((n) => n.nodeid === nodeId).meta.alarmSupportedLabels
      const typeName = alarmSupportedLabels[type].shortLabel || alarmSupportedLabels[type].label
      const nodeName = this.state.compatibleNodes.find((node) => node.nodeid === nodeId).name
      return `"${nodeName} (${typeName})"`
    }) || []
    this.props.instance.data.name = nodeNames.join(', ')
    this.props.highlightCloseButton()
  }
}

ZwaveAlarmTriggerEditForm.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveAlarmTriggerEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveAlarmTriggerEditForm.label = 'Z-wave alarm trigger'

export default ZwaveAlarmTriggerEditForm
