'use strict'

import PropTypes from 'prop-types'
import React from 'react'
import { Input, Preloader, Row } from 'react-materialize'
import uuid from 'uuid'

import zwaveBinarySwitchSchema from './schema'

class ZwaveBinarySwitchActionEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      nodeIds: []
    }

    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this.zwaveService.getNodesByProvidedFunctions(['binarySwitchInvert', 'binarySwitchTurnOn',
      'binarySwitchTurnOff', 'binarySwitchGetState'])
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
    const { compatibleNodes, ready } = this.state
    const { instance } = this.props

    return ready ? (
      <Row className='section card form'>
        {compatibleNodes.length > 0 ? instance.data.nodeIds.map((nodeId, idx) => (
          <Input key={uuid.v4()} s={12} m={6} l={4} label={`Z-wave device #${idx + 1}`} type='select' icon='power_off'
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
          label={`Z-wave device #${instance.data.nodeIds.length + 1}`} type='select' icon='power_off'
          onChange={this.nodeChanged.bind(this, instance.data.nodeIds.length)} defaultValue=''>
          <option key={uuid.v4()} value='0'>(Choose one to add)</option>
          {compatibleNodes.map((node, idx) => (
            <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
          ))}
        </Input>

        <Input s={12} m={3} label='Action' type='select' icon='power_settings_new' onChange={this.controlModeChanged.bind(this)}
          defaultValue={instance.data.controlMode || 'invert'}>
          <option key='invert' value='invert'>Invert</option>
          <option key='force-on' value='force-on'>Force ON</option>
          <option key='force-off' value='force-off'>Force OFF</option>
        </Input>
      </Row>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }

  nodeChanged (index, event) {
    const newNodeId = event.currentTarget.value
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

  controlModeChanged (event) {
    this.props.instance.data.controlMode = event.currentTarget.value
    this.nameChange()
  }

  nameChange () {
    if (this.props.instance.data.nodeIds.length === 0) {
      this.props.instance.data.name = 'Misconfigured switch control'
      return
    }
    const nodeNames = this.state.compatibleNodes
      .filter((node) => this.props.instance.data.nodeIds.includes(node.nodeid))
      .map((node) => `"${node.name}"`)
    this.props.instance.data.name = nodeNames.join(', ')
    this.props.highlightCloseButton()
  }
}

ZwaveBinarySwitchActionEditForm.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveBinarySwitchActionEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveBinarySwitchActionEditForm.label = 'Z-wave binary switch control'

export default ZwaveBinarySwitchActionEditForm
