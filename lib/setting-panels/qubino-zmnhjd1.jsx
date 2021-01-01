'use strict'

import cx from 'classnames'
import BaseSettingPanel from './base'
import PropTypes from 'prop-types'
import React from 'react'
import { Row, Button, Icon, Select } from 'react-materialize'
import NameLocation from './name-location'

import { Scenarii } from 'asterism-plugin-library'

const { StatesDropdown } = Scenarii

class QubinoZmnhjd1SettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props)

    this.state = {
      levelPercent: 20,
      stateId: null,
      levelStateControlBehavior: 'follow'
    }
  }

  componentDidMount () {
    const pop = this.props.productObjectProxy

    this.socket.on('node-event-multi-level-switch-changed', (nodeId, value, instance, index) => {
      if (this.props.nodeId !== nodeId || index !== 0 || instance !== 1) {
        return
      }
      if (this.mounted) {
        pop.multiLevelSwitchGetPercent()
        .then((levelPercent) => {
          this.setState({ levelPercent })
        })
      }
    })

    Promise.all([
      pop.multiLevelSwitchGetPercent(),
      pop.getStateId(),
      pop.getStateBehavior()
    ])
    .then(([levelPercent, stateId, levelStateControlBehavior]) => super.componentDidMount({
      levelPercent, stateId, levelStateControlBehavior
    }))
    .catch(console.error)
  }

  render () {
    const { animationLevel, theme, services, productObjectProxy } = this.props
    const { panelReady, levelPercent, stateId, levelStateControlBehavior } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined
    const currentlies = { '0': 'Off', '15': 'Frost free', '25': 'Economic', '35': 'Comfort -2°C',
      '45': 'Comfort -1°C', '100': 'Comfort'}

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m7 l7'>Pilot Wire settings</h4>
          <div className='col s12 m3 l3'>Currently {currentlies[`${levelPercent}`]}.</div>

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
          <h5 className='col s12'>Link to a scenarii level state (6 levels minimum)</h5>

          <div className='col s12 m6'>
            <StatesDropdown defaultStateId={stateId} onChange={this.stateIdChange.bind(this)}
              theme={theme} animationLevel={animationLevel} services={services}
              typeFilter={(e) => e.id === 'level-state'} instanceFilter={(e) => e.typeId === 'level-state'}>
              <option key='no-state-option' value={''}>No link</option>
            </StatesDropdown>
          </div>

          {!!stateId && (stateId.length > 0) && (
            <Select s={12} label='Choose level state control behavior' icon='sync_alt'
              onChange={this.changeLevelStateControlBehavior.bind(this)} value={levelStateControlBehavior}>
              <option value='force'>Force mode: Device will be the only one allowed to control the state</option>
              <option value='follow'>Follow mode: Device will follow level state but can be controlled anyway</option>
              <option value='controlled'>Controlled mode: state and device can control each others (warning: avoid loops with scenario actions!)</option>
            </Select>
          )}
        </Row>
      </div>
    ) : super.render()
  }

  changeMultiLevelValue (value) {
    this.props.productObjectProxy.multiLevelSwitchSetPercent(value, 1)
    this.setState({ levelPercent: value })
  }

  stateIdChange (value) {
    this.props.productObjectProxy.setStateId(value)
    .then(() => {
      this.setState({ stateId: value })
    })
    .catch(console.error)
  }

  changeLevelStateControlBehavior (event) {
    const value = event.currentTarget.value
    this.props.productObjectProxy.setStateBehavior(value)
    .then(() => {
      this.setState({ levelStateControlBehavior: value })
    })
    .catch(console.error)
  }
}

QubinoZmnhjd1SettingPanel.propTypes = {
  ...BaseSettingPanel.propTypes,
  reconfigureElement: PropTypes.func.isRequired
}

export default QubinoZmnhjd1SettingPanel
