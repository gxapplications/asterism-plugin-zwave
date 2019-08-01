'use strict'

import PropTypes from 'prop-types'
import React from 'react'
import { Preloader, Row } from 'react-materialize'

import { CollectionSetting } from 'asterism-plugin-library'
import ZwaveCentralSceneLearner from '../../central-scene-learner'

class ZwaveCentralSceneTriggerEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']
    this.privateSocket = this.zwaveService.privateSocket

    this.state = {
      compatibleNodes: [],
      ready: false,
      nodes: [],
      deleteConfirm: false
    }

    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this.zwaveService.getNodesByProvidedFunctions(['centralSceneGetLabel'])
    .then((nodes) => {
      if (this._mounted) {
        this.setState({
          compatibleNodes: nodes,
          ready: true,
          nodes: this.props.instance.data.nodes.map((n) => ({
              nodeId: n.nodeId,
              centralSceneValue: n.centralSceneValue,
              node: nodes.find((node) => node.nodeid === n.nodeId)
            }))
        })
      }
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }

  render () {
    const { theme, animationLevel } = this.props
    const { ready, compatibleNodes, nodes, deleteConfirm } = this.state

    const list = nodes.map((n, idx) => ({
      title: n.node.location ? `${n.node.name} @ ${n.node.location}` : n.node.name,
      icon: n.node.meta.icon,
      details: n.centralSceneValue.toString(),
      css: 'remote-row',
      secondary: {
        icon: 'delete',
        onClick: (event) => {
          event.stopPropagation()
          event.preventDefault()
          this.deleteNode(n, idx)
        },
        css: deleteConfirm === idx ? `delete-confirm ${theme.actions.negative}` : null
      }
    }))

    return ready ? (
      <Row className='section central-scene-learner'>
        <CollectionSetting theme={theme} animationLevel={animationLevel}
          list={list} header='Central scene events' addElement={{
            empty: { title: 'No event selected. Please add with learning mode.', icon: 'settings_remote' },
            trailing: false
          }}
        />
        <br />

        {compatibleNodes.length > 0 ? (
          <ZwaveCentralSceneLearner theme={theme} animationLevel={animationLevel} zwaveService={this.zwaveService}
            privateSocket={this.privateSocket} compatibleNodes={compatibleNodes} setSelection={this.addSelection.bind(this)} />
        ) : (
          <p>No compatible node available on the network.</p>
        )}

      </Row>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }

  addSelection (selecteds) {
    this.props.instance.data.nodes = [...this.props.instance.data.nodes, ...selecteds.map((s) => ({
      nodeId: s.nodeId,
      centralSceneValue: s.centralSceneValue
    }))]
    this.setState({
      nodes: [...this.state.nodes, ...selecteds]
    })

    this.nameChange()
  }

  nameChange () {
    const names = this.props.instance.data.nodes
    .map((n) => [this.state.compatibleNodes.find((node) => node.nodeid === n.nodeId), n.centralSceneValue])
    .map(([n, v]) => `${n.name}/${v.toString()}`)

    if (names.length === 1) {
      return this.props.instance.data.name = names[0]
    }
    if (names.length === 0) {
      return this.props.instance.data.name = 'Unconfigured Z-wave central scene trigger'
    }

    this.props.instance.data.name = `[${names.join(', ')}]`
    this.props.highlightCloseButton()
  }

  deleteNode (node, index) {
    if (this.state.deleteConfirm === index) {
      const nodes = this.state.nodes.filter((r, i) => i !== index)
      this.props.instance.data.nodes = nodes.map((s) => ({
        nodeId: s.nodeId,
        centralSceneValue: s.centralSceneValue
      }))
      this.setState({ nodes, deleteConfirm: null })
      return this.nameChange()
    }
    clearTimeout(this._deleteTimer)
    this.setState({ deleteConfirm: index })
    this._deleteTimer = setTimeout(() => {
      if (this._mounted) {
        this.setState({ deleteConfirm: false })
      }
    }, 3000)
  }
}

ZwaveCentralSceneTriggerEditForm.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveCentralSceneTriggerEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveCentralSceneTriggerEditForm.label = 'Z-wave central scene trigger'

export default ZwaveCentralSceneTriggerEditForm
