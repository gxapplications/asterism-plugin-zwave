'use strict'

/* global $ */
import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Preloader, Row, Button, Icon } from 'react-materialize'
import NameLocation from './name-location'

import { Scenarii } from 'asterism-plugin-library'

const { StatesDropdown } = Scenarii

class QubinoZmnhjd1SettingPanel extends React.Component {
  constructor (props) {
    super(props)

    this._socket = props.privateSocket
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      panelReady: false,
      levelPercent: 20,
      configuration: {}
    }

    this._mounted = false
  }

  componentDidMount () {
    // const configs = QubinoZmnhjd1SettingPanel.configurations
    this._mounted = true
    const o = this.props.productObjectProxy

    this._socket.on('node-event-multi-level-switch-changed', (nodeId, value, instance, index) => {
      if (this.props.nodeId !== nodeId || index !== 0 || instance !== 1) {
        return
      }
      if (this._mounted) {
        o.multiLevelSwitchGetPercent()
        .then((levelPercent) => {
          this.setState({ levelPercent })
        })
      }
    })

    Promise.all([
      o.multiLevelSwitchGetPercent()
      //o.getConfiguration(configs.TEMPERATURE_ALARM_THRESHOLD_LOW),
    ])
    .then(([levelPercent]) => {
      this.setState({
        panelReady: true,
        levelPercent,
        configuration: {}
      })
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }

  render () {
    const { nodeId, animationLevel, theme, reconfigureElement, services, productObjectProxy } = this.props
    const { panelReady, levelPercent, stateId, levelStateControlBehavior } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m7 l7'>Pilot Wire settings</h4>
          <div className='col s12 m3 l3'>Currently {levelPercent}.</div>

          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <Row className='section card form'>
          <h5 className='col s12'>State</h5>
          <Button className={cx('col s12 m4 l2', levelPercent !== 100 ? 'grey' : theme.actions.primary)} waves={waves} onClick={this.changeMultiLevelValue.bind(this, 100)} flat={levelPercent === 100}>
            Comfort<Icon left>brightness_high</Icon>
          </Button>
          <Button className={cx('col s12 m4 l2', levelPercent !== 45 ? 'grey' : theme.actions.primary)} waves={waves} onClick={this.changeMultiLevelValue.bind(this, 45)} flat={levelPercent === 45}>
            Comfort -1°C<Icon left>brightness_medium</Icon>
          </Button>
          <Button className={cx('col s12 m4 l2', levelPercent !== 35 ? 'grey' : theme.actions.primary)} waves={waves} onClick={this.changeMultiLevelValue.bind(this, 35)} flat={levelPercent === 35}>
            Comfort -2°C<Icon left>brightness_low</Icon>
          </Button>
          <Button className={cx('col s12 m4 l2', levelPercent !== 25 ? 'grey' : theme.actions.primary)} waves={waves} onClick={this.changeMultiLevelValue.bind(this, 25)} flat={levelPercent === 25}>
            Economic<Icon left>brightness_3</Icon>
          </Button>
          <Button className={cx('col s12 m4 l2', levelPercent !== 15 ? 'grey' : theme.actions.primary)} waves={waves} onClick={this.changeMultiLevelValue.bind(this, 15)} flat={levelPercent === 15}>
            Frost free<Icon left>ac_unit</Icon>
          </Button>
          <Button className={cx('col s12 m4 l2', levelPercent !== 0 ? 'grey' : theme.actions.primary)} waves={waves} onClick={this.changeMultiLevelValue.bind(this, 0)} flat={levelPercent === 0}>
            Off<Icon left>power_settings_new</Icon>
          </Button>
        </Row>

        <Row className='section card form'>
          <h5 className='col s12'>Link to a scenarii level state</h5>

          <div className='col s12 m6'>
            <StatesDropdown defaultStateId={stateId} onChange={this.stateIdChange.bind(this)}
              theme={theme} animationLevel={animationLevel} services={services}
              typeFilter={(e) => e.id === 'level-state'} instanceFilter={(e) => e.typeId === 'level-state'}>
              <option key='no-state-option' value={''}>No link</option>
            </StatesDropdown>
          </div>

          {!!stateId && (stateId.length > 0) && [
            <Select key={0} s={12} label='Choose level state control behavior'
                    onChange={this.changeLevelStateControlBehavior.bind(this)} value={levelStateControlBehavior}>
              <option value='force'>Force mode: Device will be the only one allowed to control the state</option>
              <option value='follow'>Follow mode: Device will follow level state but can be controlled anyway</option>
              <option value='controlled'>Controlled mode: state and device can control each others (warning: avoid loops with scenario actions!)</option>
            </Select>
          ]}

          TODO !0: sync its level with a 4/6 levels state (1. controlled mode = both ways ; 2. soft mode to follow level state, like fibaro wall plug !)
        </Row>
      </div>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }

  changeMultiLevelValue (value) {
    this.props.productObjectProxy.multiLevelSwitchSetPercent(value, 1)
    this.setState({
      levelPercent: value
    })
  }

  stateIdChange (a) {
    // TODO !0
  }

  changeLevelStateControlBehavior (a) {
    // TODO !0
  }
}

QubinoZmnhjd1SettingPanel.propTypes = {
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

QubinoZmnhjd1SettingPanel.configurations = {
  /*NORMAL_STATE: 1,
  LED_BEHAVIOR: 2,*/
}

export default QubinoZmnhjd1SettingPanel
