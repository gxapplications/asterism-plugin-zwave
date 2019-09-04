'use strict'

import PropTypes from 'prop-types'
import React from 'react'
import { Select, Preloader, Row } from 'react-materialize'
import uuid from 'uuid'

class ZwaveBinarySwitchStateConditionEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      nodeIds: [],
      aggregation: props.instance.data.aggregation || 'any',
      state: props.instance.data.state || 'on'
    }

    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this.zwaveService.getNodesByProvidedFunctions(['binarySwitchGetState'])
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
  }

  componentWillUnmount () {
    this._mounted = false
  }

  render () {
    const { compatibleNodes, ready, state } = this.state
    const { instance } = this.props

    const aggregation = (instance.data.aggregation === 'every') ? 'every (each of them) device(s) are' : 'at least one device is'

    return ready ? (
      <Row className='section card form'>
        <br className='col s12 m12 l12' key={uuid.v4()} />
        {compatibleNodes.length > 0 ? instance.data.nodeIds.map((nodeId, idx) => (
          <Select key={uuid.v4()} s={12} m={6} l={4} label={`Z-wave device #${idx + 1}`} icon='power_off'
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
          label={`Z-wave device #${instance.data.nodeIds.length + 1}`} icon='power_off'
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
        </Select>

        <div className='col s12 m12 l12' key={uuid.v4()}>&nbsp;</div>
        <Select s={12} label='State' icon='power_settings_new' onChange={this.stateChanged.bind(this)}
          value={instance.data.state || 'on'}>
          <option key='on' value='on'>ON</option>
          <option key='off' value='off'>OFF</option>
        </Select>

        <div className='col s12 m12 l12' key={uuid.v4()}>&nbsp;</div>
        <div className='col s12'>Pass when {aggregation} switched {state}.</div>
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

  stateChanged (event) {
    this.props.instance.data.state = event.currentTarget.value
    this.setState({
      state: this.props.instance.data.state
    })
    this.nameChange()
  }

  nameChange () {
    if (this.props.instance.data.nodeIds.length === 0) {
      this.props.instance.data.name = 'Misconfigured Z-wave Binary switch state condition'
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
          aggregatedNames = `At least one of [${nodeNames.join(' | ')}]`
          break
        case 'every':
          aggregatedNames = `Each of [${nodeNames.join(' & ')}]`
          break
      }
    }

    switch (this.props.instance.data.state) {
      case 'off':
        this.props.instance.data.name = `${aggregatedNames} OFF`
        break
      case 'on':
      default:
        this.props.instance.data.name = `${aggregatedNames} ON`
        break
    }

    this.props.highlightCloseButton()
  }
}

ZwaveBinarySwitchStateConditionEditForm.propTypes = {
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveBinarySwitchStateConditionEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveBinarySwitchStateConditionEditForm.label = 'Z-wave Binary switch state condition'

export default ZwaveBinarySwitchStateConditionEditForm
