'use strict'

/* global $ */
import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Row, Preloader } from 'react-materialize'

import NameLocation from './name-location'

class HankHkzwscn04SettingPanel extends React.Component {
  constructor (props) {
    super(props)

    const configs = HankHkzwscn04SettingPanel.configurations
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      batteryPercent: 0,
      batteryIcon: null,
      associations: [],
      panelReady: false
    }

    this._socket = props.privateSocket
    this._mounted = false
  }

  componentDidMount () {
    const configs = HankHkzwscn04SettingPanel.configurations
    this._mounted = true

    this._socket.on('node-event-battery-level-changed', (nodeId, confIndex, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }

      if (this._mounted) {
        if (this.state.batteryPercent !== value.value) {
          this.setState({
            batteryPercent: Math.round(value.value)
          })
        }
      }
    })

    const o = this.props.productObjectProxy
    Promise.all([
      o.batteryLevelGetPercent ? o.batteryLevelGetPercent() : -1,
      o.batteryLevelGetIcon ? o.batteryLevelGetIcon() : '',
      o.associableGetAssociations ? o.associableGetAssociations() : [],
    ])
    .then(([batteryPercent, batteryIcon, associations]) => {
      this.setState({
        batteryPercent: Math.round(batteryPercent),
        batteryIcon,
        associations,
        panelReady: true
      })
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }

  render () {
    const { nodeId, animationLevel, theme, services, productObjectProxy } = this.props
    const { batteryPercent, batteryIcon, associations, panelReady } = this.state
    const configs = HankHkzwscn04SettingPanel.configurations

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m12 l8'>Scene controller settings</h4>
          <div className='right'>
            <i className={cx('material-icons', batteryIcon)}>{batteryIcon}</i>&nbsp;{batteryPercent}%
          </div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <Row className='section card form'>
          <h5>No more configuration from here</h5>
          Hank Scene controller does not allow configuration yet.
          To catch button actions, you need to create a <b>Central Scene Trigger</b> from
          the Scenarii panel (Triggers tab), then use the "learn" feature and press the button you want.

          <h5>Buttons does not trigger anything ?</h5>
          Maybe you need to force the controller to wake up and say hello to asterism.
          To do that, please triple-click quickly one of the controller buttons. This may fix the problem.
        </Row>
      </div>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }
}

HankHkzwscn04SettingPanel.propTypes = {
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

HankHkzwscn04SettingPanel.configurations = {

}

export default HankHkzwscn04SettingPanel
