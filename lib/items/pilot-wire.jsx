'use strict'

import cx from 'classnames'
import React from 'react'
import { Button, Icon } from 'react-materialize'
import uuid from 'uuid'

import { Item } from 'asterism-plugin-library'

class PilotWireItem extends Item {
  constructor (props) {
    super(props)

    this.state.node = null
    this.state.productObjectProxy = null
    this.state.levelPercent = 20

    this._socket = props.context.privateSocket
    this.zwaveService = props.context.services['asterism-plugin-zwave']

    this._mounted = false
    this.receiveNewParams(this.state.params)
  }

  receiveNewParams (params) {
    this.zwaveService.getProductObjectProxyForNodeId(params.nodeId)
    .then((productObjectProxy) => {
      Promise.all([
        this.zwaveService.getNodeById(params.nodeId),
        productObjectProxy.multiLevelSwitchGetPercent()
      ])
      .then(([node, levelPercent]) => {
        this.setState({
          params, node, productObjectProxy, levelPercent
        })
      })
      .catch(console.error)
    })
  }

  componentDidMount () {
    this._mounted = true

    this._socket.on('node-event-multi-level-switch-changed', (nodeId, value) => {
      if (this.state.params.nodeId != nodeId) { // eslint-disable-line eqeqeq
        return
      }

      if (this._mounted) {
        o.multiLevelSwitchGetPercent()
        .then((levelPercent) => {
          this.setState({ levelPercent })
        })
      }
    })

    this._socket.on('controller-driver-scan-complete', () => {
      if (this._mounted) {
        this.receiveNewParams(this.state.params)
      }
    })
  }

  componentWillUnmount () {
    this._mounted = false
  }

  render () {
    const { node, levelPercent } = this.state
    const { title = '' } = this.state.params
    const { mainState, theme } = this.props.context
    const { animationLevel } = mainState()

    return (
      <Button key={this.props.id} waves={animationLevel >= 2 ? 'light' : null}
        className={cx(theme.actions[color], 'truncate fluid SensorMultiLevel')} onClick={this.click.bind(this)}>

        <Icon left>{icon}</Icon>
        <span className='twoLinesButtonTitle'>
            <span>{title}</span>
            <span>{levelPercent}</span>
        </span>
      </Button>
    )
  }

  click () {
    if (!this.state.productObjectProxy) {
      return
    }

    // TODO !0
  }
}

export default PilotWireItem
