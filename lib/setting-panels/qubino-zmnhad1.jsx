'use strict'

import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Row, Button } from 'react-materialize'
import NameLocation from './name-location'

class QubinoZmnhad1SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props, QubinoZmnhad1SettingPanel.configurations)
    this.withBinarySwitchSupport(1)

    this.state = {
      ...this.state,
      meterLastValue: null
    }
  }

  componentDidMount () {
    this.socket.on('node-event-meter-changed', (nodeId, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }

      if (this.mounted) {
        if (value.index === 0 && this.state.meterLastValueKwh !== value.value) {
          this.setState({
            meterLastValueKwh: value.value
          })
        }
        if (value.index === 2 && this.state.meterLastValueW !== value.value) {
          this.setState({
            meterLastValueW: value.value
          })
        }
      }
    })

    const pop = this.props.productObjectProxy
    Promise.all([
      pop.meterGetLastValue(1, 0), // kWh.
      pop.meterGetLastValue(1, 2), // W.
    ])
    .then(([meterLastValueKwh, meterLastValueW]) => super.componentDidMount({
      meterLastValueKwh: meterLastValueKwh ? meterLastValueKwh.v : '--',
      meterLastValueW: meterLastValueW ? meterLastValueW.v : '--',
    }))
    .catch(console.error)
  }

  render () {
    const { animationLevel, theme, productObjectProxy, nodeId } = this.props
    const { panelReady, switchStates, meterLastValueKwh, meterLastValueW } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m7 l7'>Flush 1 Relay settings</h4>
          <Button className={cx('col s12 m3 l2 fluid', theme.actions.secondary)} waves={waves}
            onClick={this.invertBinarySwitchState.bind(this, 1)}>Turn {switchStates[0] ? 'OFF' : 'ON'}</Button>
          <div className='col s12 m9 l5'>Module #{nodeId} switch actually "{switchStates[0] ? 'ON' : 'OFF'}".</div>

          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <Row>
          <Button className={cx('col s12 m6 l4 fluid', theme.actions.inconspicuous)} waves={waves}
            onClick={() => { this.props.productObjectProxy.meterResetCounter() }}>Reset energy meter</Button>
          <div className='col s12 m6 l8'>
            Actually {meterLastValueKwh || '0.00'} kWh / {meterLastValueW || '0'} W.
          </div>
        </Row>


        <Row className='section card form'>
          TODO !1: get meter on both indexes (kWh & W), then add reset button, like wall plug.

          TODO !2: configurations (& "switch all" ?)
        </Row>
      </div>
    ) : super.render()
  }
}

QubinoZmnhad1SettingPanel.propTypes = {
  ...BaseSettingPanel.propTypes,
  reconfigureElement: PropTypes.func.isRequired
}

QubinoZmnhad1SettingPanel.configurations = {
  INPUT_1_SWITCH_TYPE: 1 // TODO !2
}

export default QubinoZmnhad1SettingPanel
