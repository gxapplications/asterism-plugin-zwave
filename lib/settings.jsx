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
        if (answer.workingDriverPath) {
          $('#zwave_settings .location-field label').addClass('active')
          $('#zwave_settings .autocomplete').val(answer.workingDriverPath)
        }

        this.setState({
          commonDriverPaths: answer.commonDriverPaths || {},
          currentDriverPath: answer.workingDriverPath || '',
          controllerState: states[`${answer.initialState}`],
          stateError: answer.initialState === -1,
          buttonError: false // avoid a red button when we load the first time
        })

        const instance = M.Autocomplete.getInstance($('#zwave_settings .autocomplete'))
        instance.updateData(answer.commonDriverPaths)
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
            <Autocomplete value={currentDriverPath}
              onChange={this.onPathChanged.bind(this)}
              options={{ minLength: 1, limit: 10, onAutocomplete: this.onPathChoosed.bind(this), data: commonDriverPaths }}
              title='Device path' id='zwave-controller-path' s={12} m={9} l={8} />
            <Button className={cx('col s12 m3 l4 fluid', buttonError ? theme.feedbacks.error : theme.actions.primary)}
              disabled={restartCmdWaiting} waves={waves} onClick={this.connect.bind(this, currentDriverPath)}>
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

  onPathChanged (value) {
    this.setState({
      currentDriverPath: value.currentTarget.value
    })
  }

  onPathChoosed (value) {
    this.setState({
      currentDriverPath: value
    })

    this.forceUpdate(this.connect.bind(this, value))
  }

  connect (path) {
    this.setState({
      currentDriverPath: path || this.state.currentDriverPath,
      restartCmdWaiting: true,
      controllerState: states['1'],
      stateError: false,
      buttonError: false
    })

    const instance = M.Autocomplete.getInstance($('#zwave_settings .autocomplete'))
    $(instance.el).val(path || this.state.currentDriverPath)

    this._socket.emit('controller-reconnect', path || this.state.currentDriverPath, (answer) => {
      $(instance.el).val(path || this.state.currentDriverPath)
      if (answer) {
        setTimeout(() => {
          this.setState({ restartCmdWaiting: true, stateError: false, buttonError: false })
          $(instance.el).val(path || this.state.currentDriverPath)
        }, 500)
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
