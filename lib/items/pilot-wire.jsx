'use strict'

import cx from 'classnames'
import React from 'react'
import { Button, Icon, Row } from 'react-materialize'

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
        this.state.productObjectProxy.multiLevelSwitchGetPercent()
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
    const { levelPercent, productObjectProxy } = this.state
    const { title = '', orders = 4 } = this.state.params
    const { mainState, theme } = this.props.context
    const { animationLevel } = mainState()

    const width = (orders == 3) ? 'm12 l12' : (orders == 4 ? 'm6 l6' : (orders == 5 ? 'm12 l12' : 'm6 l6')) // comfort
    const width2 = (orders == 3) ? 'm12 l12' : (orders == 4 ? 'm6 l6' : (orders == 5 ? 'm6 l6' : 'm6 l6')) // -1, -2
    const width3 = (orders == 3) ? 'm6 l6' : (orders == 4 ? 'm6 l6' : (orders == 5 ? 'm6 l6' : 'm6 l6')) // Eco
    const width4 = (orders == 3) ? 'm6 l6' : (orders == 4 ? 'm6 l6' : (orders == 5 ? 'm6 l6' : 'm6 l6')) // Frost free & Off

    return productObjectProxy ? (
      <div key={this.props.id} className={cx('PilotWireItem fluid', theme.backgrounds.card)}>
        {title && title.length > 0 && (
          <Row className='col s12 mainTitle'>
            <div className='fluid'>
              <div className='truncate'>{title}</div>
            </div>
          </Row>
        )}

        <Row className='col s12 switches thin-scrollable'>
          <div className={cx('col s12 row', width)}>
            <Button waves={animationLevel >= 2 ? 'light' : null} onClick={this.click.bind(this, 100)}
                    className={cx('truncate fluid col s12', levelPercent !== 100 ? theme.actions.secondary : theme.actions.inconspicuous)} >
              <Icon left>brightness_high</Icon>Comfort
            </Button>
          </div>
          {orders > 4 && (
            <div className={cx('col s12 row', width2)}>
              <Button waves={animationLevel >= 2 ? 'light' : null} onClick={this.click.bind(this, 45)}
                className={cx('truncate fluid col s12', levelPercent !== 45 ? theme.actions.secondary : theme.actions.inconspicuous)} >
                <Icon left>brightness_medium</Icon>Comfort -1°C
              </Button>
            </div>
          )}
          {orders > 4 && (
            <div className={cx('col s12 row', width2)}>
              <Button waves={animationLevel >= 2 ? 'light' : null} onClick={this.click.bind(this, 35)}
                className={cx('truncate fluid col s12', levelPercent !== 35 ? theme.actions.secondary : theme.actions.inconspicuous)} >
                <Icon left>brightness_low</Icon>Comfort -2°C
              </Button>
            </div>
          )}
          <div className={cx('col s12 row', width3)}>
            <Button waves={animationLevel >= 2 ? 'light' : null} onClick={this.click.bind(this, 25)}
              className={cx('truncate fluid col s12', levelPercent !== 25 ? theme.actions.secondary : theme.actions.inconspicuous)} >
              <Icon left>brightness_3</Icon>Economic
            </Button>
          </div>
          <div className={cx('col s12 row', width4)}>
            <Button waves={animationLevel >= 2 ? 'light' : null} onClick={this.click.bind(this, 15)}
              className={cx('truncate fluid col s12', levelPercent !== 15 ? theme.actions.secondary : theme.actions.inconspicuous)} >
              <Icon left>ac_unit</Icon>Frost free
            </Button>
          </div>
          {(orders == 4 || orders == 6) && (
            <div className={cx('col s12 row', width4)}>
              <Button waves={animationLevel >= 2 ? 'light' : null} onClick={this.click.bind(this, 0)}
                className={cx('truncate fluid col s12', levelPercent !== 0 ? theme.actions.secondary : theme.actions.inconspicuous)} >
                <Icon left>power_settings_new</Icon>Off
              </Button>
            </div>
          )}
        </Row>
      </div>
    ) : (
      <Button waves={animationLevel >= 2 ? 'light' : null} className={cx(theme.feedbacks.warning, 'truncate fluid')} onClick={() => {}}>
        <Icon left className='red-text'>healing</Icon>
        No pilot wire controller set
      </Button>
    )
  }

  click (value) {
    if (!this.state.productObjectProxy) {
      return
    }

    this.state.productObjectProxy.multiLevelSwitchSetPercent(value, 1)
  }

  refresh () {
    if (this._mounted) {
      this.receiveNewParams(this.state.params)
    }
  }
}

export default PilotWireItem
