'use strict'

import PropTypes from 'prop-types'
import React from 'react'
import { Button } from 'react-materialize'

import StandardProductChanger from './standard-product-changer'

class UnknownSettingPanel extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      deleteConfirm: false
    }

    this._mounted = false
    this._deleteTimer = null
  }

  componentDidMount () {
    this._mounted = true
  }

  componentWillUnmount () {
    this._mounted = false
  }

  render () {
    const { nodeId, animationLevel, theme, reconfigureElement, services } = this.props
    const { deleteConfirm } = this.state

    const deleteWaves = animationLevel >= 2 ? 'btn-flat waves-effect waves-red' : 'btn-flat'
    const deleteWavesConfirm = (animationLevel >= 2 ? 'btn waves-effect waves-light' : 'btn') + ` ${theme.actions.negative}`

    return (
      <div className='section card form'>
        Your product is not directly supported by this version of Asterism. You can try a standard support:
        <br />
        <StandardProductChanger nodeId={nodeId} animationLevel={animationLevel} theme={theme}
          zwaveService={services()['asterism-plugin-zwave']} reconfigureElement={reconfigureElement} />
        <br /><br />
        If you think this node ID is dead, you can remove it from the Z-wave controller here. This action
        cannot be undone.
        <br />
        <Button className={deleteConfirm ? deleteWavesConfirm : deleteWaves} onClick={this.removeNode.bind(this)}>
          <i className='material-icons'>delete</i> Remove node definitely
        </Button>
      </div>
    )
  }

  removeNode () {
    if (this.state.deleteConfirm) {
      const zwaveService = this.props.services()['asterism-plugin-zwave']
      zwaveService.removeNode(this.props.nodeId)
      .then(() => {
        console.log('##### SUCCESS ! Must rescan ?') // TODO !0
        // zwaveService.rescan()
      })
    } else {
      this.setState({ deleteConfirm: true })
      clearTimeout(this._deleteTimer)
      this._deleteTimer = setTimeout(() => {
        if (this._mounted) {
          this.setState({ deleteConfirm: false })
        }
      }, 3000)
    }
  }
}

UnknownSettingPanel.propTypes = {
  serverStorage: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  localStorage: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  privateSocket: PropTypes.object.isRequired,
  productObjectProxy: PropTypes.object.isRequired,
  nodeId: PropTypes.number.isRequired,
  reconfigureElement: PropTypes.func.isRequired
}

export default UnknownSettingPanel
