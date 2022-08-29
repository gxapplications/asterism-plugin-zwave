'use strict'

import PropTypes from 'prop-types'
import React from 'react'
import { Select, Preloader, Row } from 'react-materialize'
import uuid from 'uuid'

class ZwaveBinarySwitchStateTriggerEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      nodes: []
    }

    this._mounted = false
  }

  _getSupportedInstancesForNode (node) {
    return this.zwaveService.getProductObjectProxyForNodeId(node.nodeid, node.meta)
      .then((prodObjProxy) => prodObjProxy.binarySwitchGetSupportedInstances ? prodObjProxy.binarySwitchGetSupportedInstances() : [1])
      .then((supportedInstances) => [node, supportedInstances])
  }

  componentDidMount () {
    this._mounted = true
    this.zwaveService.getNodesByProvidedFunctions(['binarySwitchGetState'])
    .then((nodes) => {
      if (this._mounted) {
        Promise.all(nodes.map(this._getSupportedInstancesForNode.bind(this)))
        .then((nodesAndSupportedInstances) => {
          this.setState({
            compatibleNodes: nodesAndSupportedInstances.length
                ? nodesAndSupportedInstances
                : [[{nodeid: 0, name: 'No compatible device available'}, [1]]],
            ready: true
          })
          if (nodes.length === 1) {
            this.props.instance.data.nodes[0] = { id: nodes[0].nodeid, instance: 1 }
            this.nameChange()
            this.setState({
              nodes: this.props.instance.data.nodes
            })
          }
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

    const nodes = instance.data.nodes.map(({ id }) => compatibleNodes.find((n) => n[0].nodeid === id))

    return ready ? (
      <Row className='section card form'>
        <br className='col s12 m12 l12' key={uuid.v4()} />
        {compatibleNodes.length > 0 ? instance.data.nodes.map(({ id, instance }, idx) => (
            <div key={uuid.v4()}>
              <Select key={uuid.v4()} s={12} m={6} l={4} label={`Z-wave device #${idx + 1}`} icon='power_off'
                onChange={this.nodeChanged.bind(this, idx)} value={`${id}`}>
                {compatibleNodes.map(([node, supportedInstances], i) => (
                  <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
                ))}
                <option key={uuid.v4()} value='0'>(Remove it)</option>
              </Select>
              {nodes[idx][1].length > 1 && (
                <Select key={uuid.v4()} s={6} m={4} l={2} label={`instance #${idx + 1}`}
                  onChange={this.instanceChanged.bind(this, idx)} value={`${instance}`}>
                  {nodes[idx][1].map((supportedInstance) => (
                    <option key={uuid.v4()} value={supportedInstance}>{supportedInstance}</option>
                  ))}
                </Select>
              )}
            </div>
        )) : (
          <div>Compatible devices not found on the network.</div>
        )}

        <Select key={uuid.v4()} s={12} m={6} l={4}
          label={`Z-wave device #${instance.data.nodes.length + 1}`} icon='power_off'
          onChange={this.nodeChanged.bind(this, instance.data.nodes.length)} value=''>
          <option key={uuid.v4()} value='' disabled>(Choose one to add)</option>
          {compatibleNodes.map(([node, supportedInstances], idx) => (
              <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
          ))}
        </Select>

        <div className='col s12 m12 l12' key={uuid.v4()}>&nbsp;</div>
        <Select s={12} label='Event' icon='power_settings_new' onChange={this.eventChanged.bind(this)}
          value={instance.data.event || 'inverted'}>
          <option key='inverted' value='inverted'>Inverted</option>
          <option key='turned-on' value='turned-on'>Turned ON</option>
          <option key='turned-off' value='turned-off'>Turned OFF</option>
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
      this.props.instance.data.nodes[index] = { id: newNodeId, instance: 1 }
    } else {
      const nodes = this.props.instance.data.nodes.filter(({ id, instance }, idx) => idx !== index)
      if (nodes.length > 0) { // avoid to remove all nodes (1 min needed)
        this.props.instance.data.nodes = nodes
      }
    }
    this.setState({
      nodes: this.props.instance.data.nodes
    })
    this.nameChange()
  }

  instanceChanged (index, event) {
    this.props.instance.data.nodes[index].instance = parseInt(event.currentTarget.value)
    this.setState({
      nodes: this.props.instance.data.nodes
    })
    this.nameChange()
  }

  eventChanged (event) {
    this.props.instance.data.event = event.currentTarget.value
    this.nameChange()
  }

  nameChange () {
    if (this.props.instance.data.nodes.length === 0) {
      this.props.instance.data.name = 'Misconfigured Z-wave Binary switch state trigger'
      this.props.highlightCloseButton()
      return
    }

    const nodeNames = this.state.compatibleNodes
      .filter(([node, supportedInstances]) => this.props.instance.data.nodes.map(({ id }) => id).includes(node.nodeid))
      .map(([node, supportedInstances]) => {
        const instance = this.props.instance.data.nodes.find(({ id }) => id === node.nodeid).instance
        return (supportedInstances.length > 1) ? `"${node.name}"#${instance}` : `"${node.name}"`
      })

    this.props.instance.data.name = nodeNames.length > 1 ? `[${nodeNames.join('|')}]` : nodeNames[0]
    this.props.highlightCloseButton()
  }
}

ZwaveBinarySwitchStateTriggerEditForm.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveBinarySwitchStateTriggerEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveBinarySwitchStateTriggerEditForm.label = 'Z-wave binary switch state trigger'

export default ZwaveBinarySwitchStateTriggerEditForm
