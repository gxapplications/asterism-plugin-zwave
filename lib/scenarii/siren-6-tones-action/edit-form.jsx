'use strict'

import PropTypes from 'prop-types'
import React from 'react'
import { Select, Preloader, Row, Checkbox } from 'react-materialize'
import uuid from 'uuid'

class ZwaveSiren6TonesActionEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      nodeIds: [],
      volume: this.props.instance.data.volume || 2,
      tone: this.props.instance.data.tone || 255,
      wait: this.props.instance.data.wait
    }

    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this.zwaveService.getNodesByProvidedFunctions(['playTone'])
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
    const { compatibleNodes, ready, wait, tone, volume } = this.state
    const { instance } = this.props

    return ready ? (
      <Row className='section card form'>
        <br className='col s12 m12 l12' />
        {compatibleNodes.length > 0 ? instance.data.nodeIds.map((nodeId, idx) => (
          <Select key={uuid.v4()} s={12} m={6} l={4} label={`Z-wave device #${idx + 1}`} icon='campaign'
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
          label={`Z-wave device #${instance.data.nodeIds.length + 1}`} icon='campaign'
          onChange={this.nodeChanged.bind(this, instance.data.nodeIds.length)} value={''}>
          <option key={uuid.v4()} value='' disabled>(Choose one to add)</option>
          {compatibleNodes.map((node, idx) => (
            <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
          ))}
        </Select>

        <br className='col s12 m12 l12' />
        <hr className='col s12 m12 l12' />
        <br className='col s12 m12 l12' />

        <Select s={12} m={6} l={6}
          label='Volume' icon='signal_cellular_art'
          onChange={this.volumeChanged.bind(this)} value={volume}
        >
          <option value='' disabled>Volume</option>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </Select>
        <Select s={12} m={6} l={6}
          label='Tone to use' icon='music_note'
          onChange={this.toneChanged.bind(this)} value={tone}
        >
          <option value='' disabled>Tone to use</option>
          <option value={0}>Stop</option>
          <option value={1}>Fire</option>
          <option value={2}>Ambulance</option>
          <option value={3}>Police</option>
          <option value={4}>Alarm</option>
          <option value={5}>Ding dong</option>
          <option value={6}>Beep</option>
          <option value={255}>Default tone</option>
        </Select>
        <Checkbox
          className='filled-in' value='1' label='Wait for sound to finish' s={12} m={6} l={6}
          onChange={() => this.waitChanged(!wait)} checked={wait}
        />
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

  nameChange () {
    if (this.props.instance.data.nodeIds.length === 0) {
      this.props.instance.data.name = 'Misconfigured siren 6 tones action'
      this.props.highlightCloseButton()
      return
    }
    const nodeNames = this.state.compatibleNodes
      .filter((node) => this.props.instance.data.nodeIds.includes(node.nodeid))
      .map((node) => `"${node.name}"`)

    this.props.instance.data.name = `[${nodeNames.join(',')}]`

    this.props.highlightCloseButton()
  }

  waitChanged (wait) {
    this.props.instance.data.wait = wait
    this.setState({
      wait: this.props.instance.data.wait
    })
    this.nameChange()
  }

  toneChanged (event) {
    const tone = parseInt(event.currentTarget.value)
    this.props.instance.data.tone = tone
    this.setState({
      tone: this.props.instance.data.tone
    })
    this.nameChange()
  }

  volumeChanged (event) {
    const volume = parseInt(event.currentTarget.value)
    this.props.instance.data.volume = volume
    this.setState({
      volume: this.props.instance.data.volume
    })
    this.nameChange()
  }
}

ZwaveSiren6TonesActionEditForm.propTypes = {
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveSiren6TonesActionEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveSiren6TonesActionEditForm.label = 'Z-wave Philio PSE04 siren control'

export default ZwaveSiren6TonesActionEditForm
