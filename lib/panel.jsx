'use strict'

/* global $ */
import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Icon, Preloader, Row } from 'react-materialize'

import { CollectionSetting } from 'asterism-plugin-library'
import styles from './styles.scss'

class ZwaveEditPanel extends React.Component {
  constructor (props) {
    super(props)

    this._socket = props.privateSocket
    this._zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      controllerState: this._zwaveService.getControllerState(),
      nodes: null,
      rescanInProgress: false,
      ConfigurePanel: null,
      configurePanelObjectProxy: null
    }

    this._mounted = false
  }

  componentDidMount () {
    this._mounted = true

    this._socket.on('controller-driver-disconnect', () => {
      if (this._mounted) {
        this.setState({
          controllerState: 1
        })
      }
    })
    this._socket.on('controller-driver-ready', () => {
      if (this._mounted) {
        this.setState({
          controllerState: 2
        })
      }
    })
    this._socket.on('controller-driver-failure', () => {
      if (this._mounted) {
        this.setState({
          controllerState: -1,
          rescanInProgress: false
        })
      }
    })
    this._socket.on('controller-driver-scan-complete', () => {
      if (this._mounted) {
        this.setState({
          controllerState: 3,
          rescanInProgress: false
        })
      }
    })

    this._socket.on('refresh-needed', () => {
      if (this._mounted) {
        this._zwaveService.getNodes()
        .then((nodes) => {
          this.setState({ nodes })
        })
      }
    })

    this._zwaveService.getNodes()
    .then((nodes) => {
      this.setState({ nodes })
    })
  }

  componentWillUnmount () {
    this._mounted = false
  }

  render () {
    const { theme, animationLevel, privateSocket, serverStorage, localStorage, services } = this.props
    const { controllerState, nodes, rescanInProgress, ConfigurePanel, configurePanelObjectProxy } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    const list = (nodes || []).map((el) => ({
      title: el.name || `Unnamed device #${el.nodeid}`,
      icon: el.meta.icon,
      onClick: (el.ready === true && el.meta.settingPanel) ? this.configureElement.bind(this, el) : undefined,
      details: `${el.location || 'Location unknown'}, ${el.meta.type} (${el.meta.product} from ${el.meta.manufacturer})`,
      secondary: {
        icon: el.ready === false ? 'block' : (el.ready === true ? 'check' : 'youtube_searched_for')
      }
    }))

    return (
      <div id='zwave-edit-panel' className={cx(styles.ZwaveEditPanel, { 'configurePanelOpened': !!ConfigurePanel })}>
        {(controllerState < 3 && !rescanInProgress) ? (
          <div className='not-ready'>
            <div className='valign-wrapper'>
              <div>
                <p><Icon left>warning</Icon>The Zwave controller is not ready or not found.<br />You can configure it below:</p>
                <Button className={cx(theme.actions.secondary)} onClick={this.openSettings.bind(this)} waves={waves}>Open Zwave settings</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className='ready'>
            <Row>
              {rescanInProgress ? (
                <Button className={cx(theme.actions.secondary, 'col s6 m3 l3')} disabled waves={waves}>
                  <Preloader size='small' />
                </Button>
              ) : (
                <Button className={cx(theme.actions.secondary, 'col s6 m3 l3')} disabled={controllerState < 3}
                  onClick={this.rescan.bind(this)} waves={waves}>
                  <i className="material-icons left">youtube_searched_for</i>Re-scan
                </Button>
              )}

              <div className='col s5 offset-s1 m3 offset-m1 l2 offset-l1'>&nbsp;</div>

              <Button className={cx(theme.actions.inconspicuous, 'col s7 m4 offset-m1 l3 offset-l1')}
                onClick={this.openSettings.bind(this)} waves={waves}><i className="material-icons left">settings</i>Open settings</Button>
            </Row>

            {nodes !== false ? (
              <CollectionSetting theme={theme} animationLevel={animationLevel}
                list={list} header='Devices in your network'
                addElement={{
                  empty: { title: 'No device found... Need help?', icon: 'device_hub' },
                  trailing: { title: 'How to add a new device' },
                  onClick: this.helpAdd.bind(this)
                }}
              />
            ) : null}
          </div>
        )}

        <div className={cx('configurePanel thin-scrollable', theme.backgrounds.body)}>
          {ConfigurePanel ? (
            <ConfigurePanel productObjectProxy={configurePanelObjectProxy} serverStorage={serverStorage}
              localStorage={localStorage} theme={theme} animationLevel={animationLevel}
              services={services} privateSocket={privateSocket} nodeId={configurePanelObjectProxy.nodeid}
            />
          ) : null}
        </div>
      </div>
    )
  }

  handleCloseButton () {
    if (!this.state.ConfigurePanel) {
      // do not handle close button event: modal will close
      return Promise.reject(false) // eslint-disable-line prefer-promise-reject-errors
    }

    // close ConfigurePanel sliding card: modal will not close now
    this.setState({ ConfigurePanel: null, configurePanelObjectProxy: null })
    return Promise.resolve(true)
  }

  rescan () {
    this.setState({ rescanInProgress: true })
    return this._zwaveService.rescan()
  }

  openSettings () {
    $('#edit-panel-modal').modal('close')
    setTimeout(this._zwaveService.openSettings.bind(this._zwaveService), 250)
  }

  configureElement (element) {
    if (element.meta.settingPanel) {
      const panel = this._zwaveService.getSettingPanel(element.meta.settingPanel)
      if (panel) {
        this._zwaveService.getProductObjectProxyForNodeId(element.nodeid)
        .then((productObjectProxy) => {
          this.setState({
            ConfigurePanel: panel,
            configurePanelObjectProxy: productObjectProxy
          })
        })
      }
    }
  }

  helpAdd () {
    // TODO !9
  }
}

ZwaveEditPanel.propTypes = {
  serverStorage: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  localStorage: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  privateSocket: PropTypes.object.isRequired
}

ZwaveEditPanel.label = 'Zwave network'
ZwaveEditPanel.icon = 'zwave-on'
ZwaveEditPanel.hideHeader = false

ZwaveEditPanel.onReady = () => {

}

export default ZwaveEditPanel
