'use strict'

import settingPanels from './setting-panels'

import BrowserZwaveBinarySwitchAction from './scenarii/binary-switch-action/browser'
import zwaveBinarySwitchSchema from './scenarii/binary-switch-action/schema'
import BrowserZwaveMeterResetAction from './scenarii/meter-reset-action/browser'
import zwaveMeterResetSchema from './scenarii/meter-reset-action/schema'
import BrowserZwaveBinarySwitchStateTrigger from './scenarii/binary-switch-state-trigger/browser'
import zwaveBinarySwitchStateTriggerSchema from './scenarii/binary-switch-state-trigger/schema'
import BrowserZwaveInstantEnergyLimitTrigger from './scenarii/instant-energy-limit-trigger/browser'
import zwaveInstantEnergyLimitTriggerSchema from './scenarii/instant-energy-limit-trigger/schema'
import BrowserZwaveEnergyConsumptionLimitTrigger from './scenarii/energy-consumption-limit-trigger/browser'
import zwaveEnergyConsumptionLimitTriggerSchema from './scenarii/energy-consumption-limit-trigger/schema'
import BrowserZwaveBatteryLevelTrigger from './scenarii/battery-level-trigger/browser'
import zwaveBatteryLevelTriggerSchema from './scenarii/battery-level-trigger/schema'
import BrowserZwaveDeadNodeTrigger from './scenarii/dead-node-trigger/browser'
import zwaveDeadNodeTriggerSchema from './scenarii/dead-node-trigger/schema'
import BrowserZwaveCentralSceneTrigger from './scenarii/central-scene-trigger/browser'
import zwaveCentralSceneTriggerSchema from './scenarii/central-scene-trigger/schema'
import BrowserZwaveBatteryLevelCondition from './scenarii/battery-level-condition/browser'
import zwaveBatteryLevelConditionSchema from './scenarii/battery-level-condition/schema'
import BrowserZwaveEnergyConsumptionCondition from './scenarii/energy-consumption-condition/browser'
import zwaveEnergyConsumptionConditionSchema from './scenarii/energy-consumption-condition/schema'
import BrowserZwaveInstantEnergyCondition from './scenarii/instant-energy-condition/browser'
import zwaveInstantEnergyConditionSchema from './scenarii/instant-energy-condition/schema'
import BrowserZwaveBinarySwitchStateCondition from './scenarii/binary-switch-state-condition/browser'
import zwaveBinarySwitchStateConditionSchema from './scenarii/binary-switch-state-condition/schema'
import BrowserZwaveTemperatureCondition from './scenarii/temperature-condition/browser'
import zwaveTemperatureConditionSchema from './scenarii/temperature-condition/schema'
import BrowserZwaveTemperatureTrigger from './scenarii/temperature-trigger/browser'
import zwaveTemperatureTriggerSchema from './scenarii/temperature-trigger/schema'
import BrowserZwaveAlarmTrigger from './scenarii/alarm-trigger/browser'
import zwaveAlarmTriggerSchema from './scenarii/alarm-trigger/schema'
import BrowserZwaveAlarmCondition from './scenarii/alarm-condition/browser'
import zwaveAlarmConditionSchema from './scenarii/alarm-condition/schema'

export default class ZwaveBrowserService {
  constructor ({ getServices, notificationManager, mainState, privateSocket, publicSockets }) {
    this.privateSocket = privateSocket
    this.mainState = mainState
    this._controllerState = 0

    this.privateSocket.on('zwave-notification-open-settings', () => {
      this.openSettings()
    })
    this.privateSocket.on('zwave-notification-open-edit-panel', () => {
      this.mainState.openEditPanel('asterism-plugin-zwave', 0)
    })

    this.privateSocket.on('zwave-notification-open-alarms-panel', () => {
      this.mainState.openEditPanel('asterism-plugin-zwave', 0) // FIXME: when we can add panels in non edit mode, should differ from this, to have separated panel for alarms
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
    this.scenariiService.registerElementType('zwave-meter-reset-action', BrowserZwaveMeterResetAction, zwaveMeterResetSchema)

    // Register scenarii triggers
    this.scenariiService.registerElementType('zwave-binary-switch-state-trigger', BrowserZwaveBinarySwitchStateTrigger, zwaveBinarySwitchStateTriggerSchema)
    this.scenariiService.registerElementType('zwave-instant-energy-limit-trigger', BrowserZwaveInstantEnergyLimitTrigger, zwaveInstantEnergyLimitTriggerSchema)
    this.scenariiService.registerElementType('zwave-energy-consumption-limit-trigger', BrowserZwaveEnergyConsumptionLimitTrigger, zwaveEnergyConsumptionLimitTriggerSchema)
    this.scenariiService.registerElementType('zwave-battery-level-trigger', BrowserZwaveBatteryLevelTrigger, zwaveBatteryLevelTriggerSchema)
    this.scenariiService.registerElementType('zwave-dead-node-trigger', BrowserZwaveDeadNodeTrigger, zwaveDeadNodeTriggerSchema)
    this.scenariiService.registerElementType('zwave-central-scene-trigger', BrowserZwaveCentralSceneTrigger, zwaveCentralSceneTriggerSchema)
    this.scenariiService.registerElementType('zwave-temperature-trigger', BrowserZwaveTemperatureTrigger, zwaveTemperatureTriggerSchema)
    this.scenariiService.registerElementType('zwave-alarm-trigger', BrowserZwaveAlarmTrigger, zwaveAlarmTriggerSchema)

    // Register scenarii conditions
    this.scenariiService.registerElementType('zwave-battery-level-condition', BrowserZwaveBatteryLevelCondition, zwaveBatteryLevelConditionSchema)
    this.scenariiService.registerElementType('zwave-energy-consumption-condition', BrowserZwaveEnergyConsumptionCondition, zwaveEnergyConsumptionConditionSchema)
    this.scenariiService.registerElementType('zwave-instant-energy-condition', BrowserZwaveInstantEnergyCondition, zwaveInstantEnergyConditionSchema)
    this.scenariiService.registerElementType('zwave-binary-switch-state-condition', BrowserZwaveBinarySwitchStateCondition, zwaveBinarySwitchStateConditionSchema)
    this.scenariiService.registerElementType('zwave-temperature-condition', BrowserZwaveTemperatureCondition, zwaveTemperatureConditionSchema)
    this.scenariiService.registerElementType('zwave-alarm-condition', BrowserZwaveAlarmCondition, zwaveAlarmConditionSchema)
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

  getNodeById (nodeId) {
    return new Promise((resolve, reject) => {
      this.privateSocket.emit('get-node-by-id', nodeId, (node) => {
        resolve(node)
      })
      setTimeout(() => {
        reject(new Error('Zwave get-node-by-id from server failed.'))
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

  getProductObjectProxyForNodeId (nodeId, meta) {
    return new Promise((resolve, reject) => {
      this.privateSocket.emit('get-node-settings-panel-provided-functions', parseInt(nodeId), (functions) => {
        const proxy = { nodeid: parseInt(nodeId), meta }
        if (functions) {
          functions.forEach((f) => {
            proxy[f] = (...args) => {
              return new Promise((res, rej) => {
                this.privateSocket.emit('call-node-public-function', parseInt(nodeId), f, args, (answer) => {
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

  changeStandardProductSupport (nodeId, productSupport) {
    return new Promise((resolve, reject) => {
      this.privateSocket.emit('set-node-product-support', parseInt(nodeId), productSupport, resolve)
    })
  }

  removeNode (nodeId) {
    return new Promise((resolve, reject) => {
      this.privateSocket.emit('remove-node', parseInt(nodeId), resolve)
    })
  }

  getAlarms () {
    return new Promise((resolve, reject) => {
      this.privateSocket.emit('get-alarms', (alarms) => {
        resolve(alarms)
      })
      setTimeout(() => {
        reject(new Error('Zwave get-alarms from server failed.'))
      }, 700)
    })
  }
}
