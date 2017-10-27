'use strict'

import settingPanels from './setting-panels'

import BrowserZwaveBinarySwitchAction from './scenarii/binary-switch-action/browser'
import zwaveBinarySwitchSchema from './scenarii/binary-switch-action/schema'

export default class ZwaveBrowserService {
  constructor ({ getServices, notificationManager, mainState, privateSocket, publicSockets }) {
    this.privateSocket = privateSocket
    this.mainState = mainState
    this._controllerState = 0

    this.privateSocket.on('notification-open-settings', () => {
      this.openSettings()
    })
    this.privateSocket.on('notification-open-edit-panel', () => {
      this.mainState.openEditPanel('asterism-plugin-zwave', 0)
    })

    this.privateSocket.on('controller-driver-disconnect', () => {
      this._controllerState = 1
    })
    this.privateSocket.on('controller-driver-ready', () => {
      this._controllerState = 2
    })
    this.privateSocket.on('controller-driver-failure', () => {
      this._controllerState = -1
    })
    this.privateSocket.on('controller-driver-scan-complete', () => {
      this._controllerState = 3
    })

    this.privateSocket.emit('controller-get-state', (answer) => {
      this._controllerState = answer
    })

    // Register scenarii actions
    this.scenariiService = getServices()['asterism-scenarii']
    this.scenariiService.registerElementType('zwave-binary-switch-action', BrowserZwaveBinarySwitchAction, zwaveBinarySwitchSchema)
  }

  getControllerState () {
    return this._controllerState
  }

  getNodes () {
    return new Promise((resolve, reject) => {
      this.privateSocket.emit('get-nodes', (nodes) => {
        resolve(nodes)
      })
      setTimeout(() => {
        reject(new Error('Zwave get-nodes from server failed.'))
      }, 700)
    })
  }

  getNodesByProvidedFunctions (providedFunctions) {
    return new Promise((resolve, reject) => {
      this.privateSocket.emit('get-nodes-by-provided-functions', providedFunctions, (nodes) => {
        resolve(nodes)
      })
      setTimeout(() => {
        reject(new Error('Zwave get-nodes-by-provided-functions from server failed.'))
      }, 700)
    })
  }

  openSettings () {
    this.mainState.openSettings('zwave_settings')
  }

  rescan () {
    return new Promise((resolve, reject) => {
      this.privateSocket.emit('controller-rescan', () => {
        resolve(true)
      })
      setTimeout(() => {
        reject(new Error('Zwave controller not responding after 10 minutes.'))
      }, 600000)
    })
  }

  getSettingPanel (settingPanelId) {
    return settingPanels[settingPanelId] || null
  }

  getProductObjectProxyForNodeId (nodeId) {
    return new Promise((resolve, reject) => {
      this.privateSocket.emit('get-node-settings-panel-provided-functions', nodeId, (functions) => {
        const proxy = { nodeid: nodeId }
        if (functions) {
          functions.forEach((f) => {
            proxy[f] = (...args) => {
              return new Promise((res, rej) => {
                this.privateSocket.emit('call-node-public-function', nodeId, f, args, (answer) => {
                  res(answer)
                })
                setTimeout(() => {
                  rej(new Error('Call to node public function timeout.'))
                }, 86400000) // 1 day
              })
            }
          })
        }

        resolve(proxy)
      })
    })
  }
}
