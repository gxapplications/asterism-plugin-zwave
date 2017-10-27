'use strict'

import PropTypes from 'prop-types'
import React from 'react'
import { Input, Preloader, Row } from 'react-materialize'

import zwaveBinarySwitchSchema from './schema'

class ZwaveBinarySwitchActionEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false
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
        <Input s={12} m={9} label='Z-wave device' type='select' icon='power' onChange={this.nodeChanged.bind(this)}
          defaultValue={instance.data.nodeId}>
          {compatibleNodes.map((node, idx) => (
              <option key={node.nodeid} value={node.nodeid}>{node.name}</option>
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

  nodeChanged (event) {
    const newNodeId = event.currentTarget.value
    this.props.instance.data.nodeId = newNodeId
    this.nameChange()
  }

  controlModeChanged (event) {
    this.props.instance.data.controlMode = event.currentTarget.value
    this.nameChange()
  }

  nameChange () {
    if (!this.props.instance.data.nodeId) {
      this.props.instance.data.name = 'Misconfigured switch control'
      return
    }
    const nodeName = this.state.compatibleNodes.find((node) => node.nodeid === this.props.instance.data.nodeId).name
    switch (this.props.instance.data.controlMode) {
      case 'invert':
      default:
        this.props.instance.data.name = `Invert "${nodeName}"`
        break
      case 'force-on':
        this.props.instance.data.name = `Turn ON "${nodeName}"`
        break
      case 'force-off':
        this.props.instance.data.name = `Turn OFF "${nodeName}"`
    }
  }
}

ZwaveBinarySwitchActionEditForm.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired
}

ZwaveBinarySwitchActionEditForm.label = 'Z-wave binary switch control'

export default ZwaveBinarySwitchActionEditForm
