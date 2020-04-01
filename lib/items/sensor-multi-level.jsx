'use strict'

import cx from 'classnames'
import React from 'react'
import { Button, Icon } from 'react-materialize'
import uuid from 'uuid'

import { Item } from 'asterism-plugin-library'

class SensorMultiLevelItem extends Item {
  constructor (props) {
    super(props)

    this.state.node = null
    this.state.productObjectProxy = null
    this.state.sensorFormattedValue = '...'

    this._socket = props.context.privateSocket
    this.zwaveService = props.context.services['asterism-plugin-zwave']

    this.receiveNewParams(this.state.params)
  }

  receiveNewParams (params) {
    this.zwaveService.getProductObjectProxyForNodeId(params.nodeId)
    .then((productObjectProxy) => {
      Promise.all([
        this.zwaveService.getNodeById(params.nodeId),
        productObjectProxy.sensorMultiLevelGetFormatted()
      ])
      .then(([node, sensorFormattedValue]) => {
        this.setState({
          params, node, productObjectProxy, sensorFormattedValue
        })
      })
      .catch(console.error)
    })
  }

  componentDidMount () {
    this._mounted = true

    this._socket.on('node-event-sensor-multi-level-changed', (nodeId, value) => {
      if (this.state.params.nodeId != nodeId) { // eslint-disable-line eqeqeq
        return
      }

      this.state.productObjectProxy.sensorMultiLevelGetFormatted()
      .then((sensorFormattedValue) => {
        if (this._mounted) {
          this.setState({
            sensorFormattedValue
          })
        }
      })
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
    const { node, sensorFormattedValue } = this.state
    const { title = '', icon = 'insert_chart_outlined', color = 'secondary' } = this.state.params
    const { mainState, theme } = this.props.context
    const { animationLevel } = mainState()

    return (
      <Button key={this.props.id} waves={animationLevel >= 2 ? 'light' : null}
        className={cx(theme.actions[color], 'truncate fluid SensorMultiLevel')} onClick={this.click.bind(this)}>

        <Icon left>{icon}</Icon>
        <span className='twoLinesButtonTitle'>
            <span>{title}</span>
            <span>{sensorFormattedValue}</span>
        </span>
      </Button>
    )
  }

  click () {
    if (!this.state.productObjectProxy) {
      return
    }
    // TODO !5: to implement at zwave third stage milestone: opens a graph in popin?
  }

  refresh () {
    if (this._mounted) {
      this.receiveNewParams(this.state.params)
    }
  }
}

export default SensorMultiLevelItem
