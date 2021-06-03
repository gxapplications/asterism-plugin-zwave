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
      configurePanelObjectProxy: null,
      alarms: []
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

    this._socket.on('node-event-alarm-triggered', () => {
      if (this._mounted) {
        this._zwaveService.getAlarms()
        .then((alarms) => {
          this.setState({ alarms })
        })
      }
    })

    Promise.all([
      this._zwaveService.getNodes(),
      this._zwaveService.getAlarms()
    ])
    .then(([nodes, alarms]) => {
      this.setState({ nodes, alarms })
    })
  }

  componentWillUnmount () {
    this._mounted = false
  }

  _getIcon (element) {
    return element.ready === false ?
      'block' :
      ((element.ready === true && !element.meta.battery) ?
        'check' :
        ((!element.battery || !element.battery.icon) ?
          'blur_circular' :
          element.battery.icon
        )
      )
  }

  render () {
    const { theme, animationLevel, privateSocket, serverStorage, localStorage, services } = this.props
    const { controllerState, nodes, rescanInProgress, ConfigurePanel, configurePanelObjectProxy, alarms } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    const list = (nodes || []).map((el) => {
      const nodeAlarms = alarms.filter(([k, a]) => a.node.nodeid === el.nodeid).map(([k, a]) => a)
      return {
        title: (el.name || `Unnamed device #${el.nodeid}`) + (el.location ? ` @ ${el.location}` : ''),
        icon: el.meta.icon,
        onClick: (el.ready !== false && el.meta.settingPanel) ? this.configureElement.bind(this, el) : undefined,
        details: nodeAlarms.map((a) => a.status.join('/')).join(' | ') || `${el.meta.type} (${el.meta.product} from ${el.meta.manufacturer})`,
        css: nodeAlarms.length > 0 ? theme.feedbacks.warning : '',
        secondary: { icon: nodeAlarms.length > 0 ? 'warning' : this._getIcon(el) }
      }
    })

    return (
      <div id='zwave-edit-panel' className={cx('thin-scrollable ZwaveEditPanel', styles.ZwaveEditPanel, { 'configurePanelOpened': !!ConfigurePanel })}>
        {(controllerState < 3 && !rescanInProgress) ? (
          <div className='not-ready'>
            <div className='valign-wrapper'>
              <div>
                <p><Icon left>warning</Icon>The Zwave controller is not ready or not found, or the initial network scan is in progress.<br />You can configure it below:</p>
                <Button className={cx(theme.actions.secondary)} onClick={this.openSettings.bind(this)} waves={waves}>Open Zwave settings</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className='ready'>
            <Row>
              {rescanInProgress ? (
                <Button className={cx(theme.actions.secondary, 'col s5 m3 l3')} disabled waves={waves}>
                  <Preloader size='small' />
                </Button>
              ) : (
                <Button className={cx(theme.actions.secondary, 'col s5 m3 l3')} disabled={controllerState < 3}
                  onClick={this.rescan.bind(this)} waves={waves}>
                  <i className="material-icons left">youtube_searched_for</i>Re-scan
                </Button>
              )}

              <div className='col s1 m3 offset-m1 l2 offset-l1'>&nbsp;</div>

              <Button className={cx(theme.actions.inconspicuous, 'col s6 m4 offset-m1 l3 offset-l1')}
                onClick={this.openSettings.bind(this)} waves={waves}><i className="material-icons left">settings</i>Open settings</Button>
            </Row>

            {nodes !== false ? (
              <CollectionSetting theme={theme} animationLevel={animationLevel}
                list={list} header='Devices in your network'
                addElement={{
                  empty: { title: 'No device found... Need help?', icon: 'device_hub' },
                  trailing: { title: 'How to add a new device?' },
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
              reconfigureElement={this.reconfigureElement.bind(this, configurePanelObjectProxy.nodeid)}
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
        this._zwaveService.getProductObjectProxyForNodeId(element.nodeid, element.meta)
        .then((productObjectProxy) => {
          this.setState({
            ConfigurePanel: panel,
            configurePanelObjectProxy: productObjectProxy
          })
        })
      }
    }
  }

  reconfigureElement (nodeId) {
    this._zwaveService.getNodes()
    .then((nodes) => {
      this.setState({
        nodes
      })
      this.configureElement(nodes.find((n) => n.nodeid === nodeId))
    })
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

ZwaveEditPanel.onReady = () => {

}

export default ZwaveEditPanel
