'use strict'

import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Row } from 'react-materialize'

import NameLocation from './name-location'

class AeotecZstickgen5SettingPanel extends BaseSettingPanel {
  render () {
    const { animationLevel, theme, productObjectProxy } = this.props
    const { panelReady } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m12 l8'>USB controller</h4>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <Row className='section card form'>
          TODO !1: experimental, test: add mode and remove mode
          <Button
            className={cx('col s12 m3 l2 fluid', theme.actions.secondary)} waves={waves}
            onClick={this.addMode.bind(this)}
          >
            Add mode
          </Button>
          <Button
            className={cx('col s12 m3 l2 fluid', theme.actions.secondary)} waves={waves}
            onClick={this.addSecureMode.bind(this)}
          >
            Add mode (secured)
          </Button>
          <Button
            className={cx('col s12 m3 l2 fluid', theme.actions.secondary)} waves={waves}
            onClick={this.removeMode.bind(this)}
          >
            Remove mode
          </Button>
        </Row>

        VERY TEST
        <Button
          className={cx('col s12 m3 l2 fluid', theme.actions.inconspicious)} waves={waves}
          onClick={this.test.bind(this)}
        >
          Nothing
        </Button>
      </div>
    ) : super.render()
  }

  addMode () {
    this.props.productObjectProxy.addMode()
  }

  addSecureMode () {
    this.props.productObjectProxy.addSecureMode()
  }

  removeMode () {
    this.props.productObjectProxy.removeMode()
  }

  test () {
    this.props.productObjectProxy.test().then(() => {
      console.log('Should be good...')
    })
  }
}

AeotecZstickgen5SettingPanel.propTypes = {
  ...BaseSettingPanel.propTypes,
  reconfigureElement: PropTypes.func.isRequired
}

export default AeotecZstickgen5SettingPanel
