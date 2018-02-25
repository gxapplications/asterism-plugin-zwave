'use strict'

/* global $ */
import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Autocomplete, Button, Preloader, Row } from 'react-materialize'

import styles from './styles.scss'

const states = {
  '-1': 'Controller not found!',
  '0': 'Controller state unknown or down',
  '1': 'Waiting for controller to respond...',
  '2': 'Controller is scanning the network...',
  '3': 'Controller connected!'
}

class ZwaveSettings extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      commonDriverPaths: {},
      currentDriverPath: '',
      restartCmdWaiting: false,
      stateError: false,
      buttonError: false,
      controllerState: states['0']
    }

    this._socket = props.privateSocket
    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this._socket.on('controller-driver-disconnect', () => {
      if (this._mounted) {
        this.setState({
          stateError: false,
          buttonError: false,
          controllerState: states[this.state.restartCmdWaiting ? '1' : '0']
        })
      }
    })
    this._socket.on('controller-driver-ready', () => {
      if (this._mounted) {
        this.setState({
          restartCmdWaiting: false,
          stateError: false,
          buttonError: false,
          controllerState: states['2']
        })
      }
    })
    this._socket.on('controller-driver-failure', () => {
      if (this._mounted) {
        this.setState({
          restartCmdWaiting: false,
          stateError: true,
          buttonError: true,
          controllerState: states['-1']
        })
      }
    })
    this._socket.on('controller-driver-scan-complete', () => {
      if (this._mounted) {
        this.setState({
          restartCmdWaiting: false,
          stateError: false,
          buttonError: false,
          controllerState: states['3']
        })
      }
    })

    // init commonDriverPaths and currentDriverPath
    this._socket.emit('controller-get-paths', (answer) => {
      if (this._mounted) {
        this._path.setState({
          value: answer.workingDriverPath || ''
        })
        $('#zwave-controller-path > input').change() // to fix refresh bug in Input component

        this.setState({
          commonDriverPaths: answer.commonDriverPaths || {},
          currentDriverPath: answer.workingDriverPath || '',
          controllerState: states[`${answer.initialState}`],
          stateError: answer.initialState === -1,
          buttonError: false // avoid a red button when we load the first time
        })
      }
    })
  }

  componentWillUnmount () {
    this._mounted = false
  }

  render () {
    const { theme, animationLevel } = this.props
    const { commonDriverPaths, currentDriverPath, restartCmdWaiting, controllerState, stateError, buttonError } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    return (
      <div id='zwave_settings' className={cx('card zwaveSettings', styles.zwaveSettings)}>
        <div className='section left-align'>
          <h5>Z-wave controller</h5>
          <p>
            Connect a Z-wave controller key here.
          </p>
          <Row className='form card'>
            <Autocomplete title='Device path' id='zwave-controller-path' data={commonDriverPaths} s={12} m={9} l={8}
              ref={(c) => { this._path = c }} defaultValue={currentDriverPath} />
            <Button className={cx('col s12 m3 l4 fluid', buttonError ? theme.feedbacks.error : theme.actions.primary)}
              disabled={restartCmdWaiting} waves={waves} onClick={this.connect.bind(this)}>
              {restartCmdWaiting ? (
                  <Preloader size='small' />
              ) : (buttonError ? 'Try again' : 'Restart')}
            </Button>
            <div className={cx('status col s12', { [theme.feedbacks.error]: stateError })}>{controllerState}</div>
          </Row>
        </div>
      </div>
    )
  }

  connect () {
    this.setState({
      restartCmdWaiting: true,
      controllerState: states['1'],
      stateError: false,
      buttonError: false
    })

    this._socket.emit('controller-reconnect', this._path.state.value, (answer) => {
      if (answer) {
        setTimeout(this.setState.bind(this, { restartCmdWaiting: true, stateError: false, buttonError: false }), 500)
      } else {
        this.setState({ restartCmdWaiting: false, stateError: true, buttonError: true, controllerState: 'Error transmitting command!' })
      }
    })
  }
}

ZwaveSettings.propTypes = {
  theme: PropTypes.object.isRequired,
  serverStorage: PropTypes.object.isRequired,
  privateSocket: PropTypes.object.isRequired,
  showRefreshButton: PropTypes.func.isRequired,
  animationLevel: PropTypes.number.isRequired
}

ZwaveSettings.tabName = 'Z-wave'

export default ZwaveSettings
