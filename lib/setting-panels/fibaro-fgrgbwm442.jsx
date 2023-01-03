'use strict'

/* global $, noUiSlider, wNumb */
import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Row, Select, Preloader } from 'react-materialize'

import { Scenarii } from 'asterism-plugin-library'

import NameLocation from './name-location'
import BaseSettingPanel from './base'

const { StatesDropdown } = Scenarii

class FibaroFgrgbwm442SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props, FibaroFgrgbwm442SettingPanel.configurations)
    this.withMultiLevelSwitchSupport(6) // instance 1 not useful, but supported anyway

    this.zwaveService = props.services()['asterism-plugin-zwave']
    this._socket = props.privateSocket

    this.state = {
      ...this.state,
      test: false,
    }
  }

  componentDidMount () {
    const pop = this.props.productObjectProxy
    Promise.all([
      Promise.resolve(true)
    ])
    .then(([isTrue]) => {
      return super.componentDidMount({
        test: isTrue,
      })
    })
    .catch(console.error)
  }

  render () {
    const { nodeId, animationLevel, theme, services, productObjectProxy } = this.props
    const { panelReady, multiLevelSwitchStates } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m7 l7'>RGBW 2 settings</h4>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
            onClick={this.changeMultiLevelValue.bind(this, 2, 0)}>OFF</Button> TODO: test if ok
          <div className='col s12 m8 l8'>Instant consumption: TODO W.</div>

          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <div className='section card form brightnesses'>
          <div className='col s12'>Highest brightness</div>
          <div className='col s12 slider'>
            <div id={`brightness-slider-${nodeId}`} />
          </div>
          <div className='col s12'>Red</div>
          <div className='col s12 slider'>
            <div id={`red-slider-${nodeId}`} />
          </div>
          <div className='col s12'>Green</div>
          <div className='col s12 slider'>
            <div id={`green-slider-${nodeId}`} />
          </div>
          <div className='col s12'>Blue</div>
          <div className='col s12 slider'>
            <div id={`blue-slider-${nodeId}`} />
          </div>
          <div className='col s12'>White</div>
          <div className='col s12 slider'>
            <div id={`white-slider-${nodeId}`} />
          </div>

          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(0, 2)}>Main, 0</Button>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(50, 2)}>Main, 50</Button>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(99, 2)}>Main, 99</Button>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(250, 2)}>Main, 250</Button>

          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(0, 3)}>Red, 0</Button>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(50, 3)}>Red, 50</Button>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(99, 3)}>Red, 99</Button>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(250, 3)}>Red, 250</Button>

          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(0, 4)}>Green, 0</Button>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(50, 4)}>Green, 50</Button>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(99, 4)}>Green, 99</Button>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(250, 4)}>Green, 250</Button>

          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(0, 5)}>Blue, 0</Button>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(50, 5)}>Blue, 50</Button>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(99, 5)}>Blue, 99</Button>
          <Button className={cx('col s6 m2 l2 offset-l1 offset-m1', theme.actions.secondary)} waves={waves}
                  onClick={() => productObjectProxy.multiLevelSwitchSetValue(250, 5)}>Blue, 250</Button>

        </div>
      </div>
    ) : super.render()
  }

  changeMultiLevelValue (instance, value) {
    this.props.productObjectProxy.multiLevelSwitchSetValue(value, instance)
  }
}

FibaroFgrgbwm442SettingPanel.propTypes = {
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

FibaroFgrgbwm442SettingPanel.configurations = {

}

export default FibaroFgrgbwm442SettingPanel
