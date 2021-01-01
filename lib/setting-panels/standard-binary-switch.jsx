'use strict'

import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Row } from 'react-materialize'

import NameLocation from './name-location'
import StandardProductChanger from './standard-product-changer'

class StandardBinarySwitchSettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props)
    this.withBinarySwitchSupport()
  }

  render () {
    const { nodeId, animationLevel, theme, reconfigureElement, productObjectProxy } = this.props
    const { switchState, panelReady } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row className='section card form'>
          Your product is not directly supported by this version of Asterism or cannot be recognized directly.
          <br />
          <StandardProductChanger nodeId={nodeId} animationLevel={animationLevel} theme={theme}
            zwaveService={this.zwaveService} reconfigureElement={reconfigureElement} />
        </Row>

        <Row>
          <h4 className='col s12 m12 l5'>Wall plug settings</h4>
          <Button className={cx('col s12 m3 l2 fluid', theme.actions.secondary)} waves={waves}
            onClick={this.invertBinarySwitchState.bind(this)}>Turn {switchState ? 'OFF' : 'ON'}</Button>
          <div className='col s12 m9 l5'>Plug #{nodeId} switch actually "{switchState ? 'ON' : 'OFF'}".</div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>
      </div>
    ) : super.render()
  }
}

StandardBinarySwitchSettingPanel.propTypes = {
  ...BaseSettingPanel.propTypes,
  reconfigureElement: PropTypes.func.isRequired
}

export default StandardBinarySwitchSettingPanel
