'use strict'

import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Icon, Input, Preloader, Row } from 'react-materialize'

import NameLocation from './name-location'
import StandardProductChanger from './standard-product-changer'

class StandardBinarySwitchSettingPanel extends React.Component {
  constructor (props) {
    super(props)

    this._socket = props.privateSocket
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      switchState: null,
      panelReady: false,
    }

    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this._socket.on('node-event-binary-switch-changed', (nodeId, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }

      if (this._mounted) {
        if (this.state.switchState !== value.value) {
          this.setState({
            switchState: value.value
          })
        }
      }
    })

    this.props.productObjectProxy.binarySwitchGetState()
    .then((switchState) => {
      this.setState({
        switchState,
        panelReady: true
      })
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }


  render () {
    const { nodeId, animationLevel, theme, reconfigureElement, productObjectProxy } = this.props
    const { switchState, panelReady } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row className='section card form'>
          Your product is not directly supported by this version of Asterism.
          <br />
          <StandardProductChanger nodeId={nodeId} animationLevel={animationLevel} theme={theme}
            zwaveService={this.zwaveService} reconfigureElement={reconfigureElement} />
        </Row>

        <Row>
          <h4 className='col s12 m12 l5'>Wall plug settings</h4>
          <Button className={cx('col s12 m3 l2 fluid', theme.actions.secondary)} waves={waves}
            onClick={() => { this.binarySwitchStateChange() }}>Turn {switchState ? 'OFF' : 'ON'}</Button>
          <div className='col s12 m9 l5'>Plug #{nodeId} switch actually "{switchState ? 'ON' : 'OFF'}".</div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>
      </div>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }

  binarySwitchStateChange () {
    this.props.productObjectProxy.binarySwitchInvert()
    .catch(console.error)
  }

}

StandardBinarySwitchSettingPanel.propTypes = {
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

export default StandardBinarySwitchSettingPanel
