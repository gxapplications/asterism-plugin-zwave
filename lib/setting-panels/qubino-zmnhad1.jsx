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

  }

  componentDidMount () {
    const pop = this.props.productObjectProxy

    Promise.all([
      Promise.resolve(true),
    ])
    .then(([ isTrue ]) => super.componentDidMount({

    }))
    .catch(console.error)
  }

  render () {
    const { animationLevel, theme, productObjectProxy, nodeId } = this.props
    const { panelReady, switchStates } = this.state

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

        <Row className='section card form'>
          TODO
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
  INPUT_1_SWITCH_TYPE: 1 // TODO
}

export default QubinoZmnhad1SettingPanel
