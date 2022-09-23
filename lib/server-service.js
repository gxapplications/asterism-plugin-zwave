'use strict'

import products from './products'
import UnknownProduct from './products/unknown'

import ServerZwaveBinarySwitchAction from './scenarii/binary-switch-action/server'
import zwaveBinarySwitchSchema from './scenarii/binary-switch-action/schema'
import ServerZwaveRgbwAction from './scenarii/rgbw-switch-action/server'
import zwaveRgbwSchema from './scenarii/rgbw-switch-action/schema'
import ServerZwaveMeterResetAction from './scenarii/meter-reset-action/server'
import zwaveMeterResetSchema from './scenarii/meter-reset-action/schema'
import ServerZwaveSiren6TonesAction from './scenarii/siren-6-tones-action/server'
import zwaveSiren6TonesSchema from './scenarii/siren-6-tones-action/schema'
import ServerZwaveBinarySwitchStateTrigger from './scenarii/binary-switch-state-trigger/server'
import zwaveBinarySwitchStateTriggerSchema from './scenarii/binary-switch-state-trigger/schema'
import ServerZwaveInstantEnergyLimitTrigger from './scenarii/instant-energy-limit-trigger/server'
import zwaveInstantEnergyLimitTriggerSchema from './scenarii/instant-energy-limit-trigger/schema'
import ServerZwaveEnergyConsumptionLimitTrigger from './scenarii/energy-consumption-limit-trigger/server'
import zwaveEnergyConsumptionLimitTriggerSchema from './scenarii/energy-consumption-limit-trigger/schema'
import ServerZwaveBatteryLevelTrigger from './scenarii/battery-level-trigger/server'
import zwaveBatteryLevelTriggerSchema from './scenarii/battery-level-trigger/schema'
import ServerZwaveDeadNodeTrigger from './scenarii/dead-node-trigger/server'
import zwaveDeadNodeTriggerSchema from './scenarii/dead-node-trigger/schema'
import ServerZwaveCentralSceneTrigger from './scenarii/central-scene-trigger/server'
import zwaveCentralSceneTriggerSchema from './scenarii/central-scene-trigger/schema'
import ServerZwaveBatteryLevelCondition from './scenarii/battery-level-condition/server'
import zwaveBatteryLevelConditionSchema from './scenarii/battery-level-condition/schema'
import ServerZwaveEnergyConsumptionCondition from './scenarii/energy-consumption-condition/server'
import zwaveEnergyConsumptionConditionSchema from './scenarii/energy-consumption-condition/schema'
import ServerZwaveInstantEnergyCondition from './scenarii/instant-energy-condition/server'
import zwaveInstantEnergyConditionSchema from './scenarii/instant-energy-condition/schema'
import ServerZwaveBinarySwitchStateCondition from './scenarii/binary-switch-state-condition/server'
import zwaveBinarySwitchStateConditionSchema from './scenarii/binary-switch-state-condition/schema'
import ServerZwaveTemperatureCondition from './scenarii/temperature-condition/server'
import zwaveTemperatureConditionSchema from './scenarii/temperature-condition/schema'
import ServerZwaveTemperatureTrigger from './scenarii/temperature-trigger/server'
import zwaveTemperatureTriggerSchema from './scenarii/temperature-trigger/schema'
import ServerZwaveAlarmTrigger from './scenarii/alarm-trigger/server'
import zwaveAlarmTriggerSchema from './scenarii/alarm-trigger/schema'
import ServerZwaveAlarmCondition from './scenarii/alarm-condition/server'
import zwaveAlarmConditionSchema from './scenarii/alarm-condition/schema'

const _getProductClass = (node) => {
  if (node.meta) {
    return node // we already have the class
  }
  const manufacturerid = node.manufacturerid.replace(/^0x/, '')
  const producttype = node.producttype.replace(/^0x/, '')
  const productid = node.productid.replace(/^0x/, '')
  return products[`${manufacturerid}-${producttype}-${productid}`] || products[node.overrideProduct] || UnknownProduct
}

class ZwaveService {
  constructor ({ getServices, zwave, dataHandler, logger, privateSocketIo, sendRefreshNeededSignal, updateNotification }) {
    this.nodes = []
    this.alarms = {}
    this.dataHandler = dataHandler
    this.logger = logger,
    this.sendRefreshNeededSignal = sendRefreshNeededSignal
    this.scenariiService = getServices()['asterism-scenarii']
    this.updateNotification = updateNotification

    this.context = { zwave, dataHandler, logger, privateSocketIo, scenariiService: this.scenariiService, zwaveService: this }

    zwave.on('node added', this._nodeAdded.bind(this, this.context))
    zwave.on('node naming', this._nodeReady.bind(this, undefined, this.context))
    zwave.on('node available', this._nodeReady.bind(this, undefined, this.context))
    zwave.on('node ready', this._nodeReady.bind(this, true, this.context))
    zwave.on('node removed', this._nodeRemoved.bind(this))
    zwave.on('node event', this._nodeEvent.bind(this))

    // other events: "node reset", "polling disabled", "polling enabled", "scene event", "create button", "delete button", "button on", "button off"
    zwave.on('scene event', this._otherEvent.bind(this, 2, this.context))
    zwave.on('button on', this._otherEvent.bind(this, 3, this.context))
    zwave.on('button off', this._otherEvent.bind(this, 4, this.context))

    zwave.on('value added', this._classValueChanged.bind(this))
    zwave.on('value changed', this._classValueChanged.bind(this))
    zwave.on('value refreshed', this._classValueChanged.bind(this))
    zwave.on('value removed', this._classValueRemoved.bind(this))
    zwave.on('notification', this._notification.bind(this))

    /* zwave.on('controller command', (nodeId, ctrlState, ctrlError, helpmsg) => {
      console.log('controller command feedback: nodeId=%d, ctrlState=%d, ctrlError=%d, helpmsg=%d', nodeId, ctrlState, ctrlError, helpmsg) // TODO !9: what to do with it?
    }) */

    // Register scenarii actions
    ServerZwaveBinarySwitchAction.logger = this.logger
    ServerZwaveBinarySwitchAction.zwaveService = this
    ServerZwaveMeterResetAction.logger = this.logger
    ServerZwaveMeterResetAction.zwaveService = this
    ServerZwaveRgbwAction.logger = this.logger
    ServerZwaveRgbwAction.zwaveService = this
    ServerZwaveSiren6TonesAction.logger = this.logger
    ServerZwaveSiren6TonesAction.zwaveService = this
    this.scenariiService.registerElementType('zwave-binary-switch-action', ServerZwaveBinarySwitchAction, zwaveBinarySwitchSchema)
    this.scenariiService.registerElementType('zwave-rgbw-switch-action', ServerZwaveRgbwAction, zwaveRgbwSchema)
    this.scenariiService.registerElementType('zwave-meter-reset-action', ServerZwaveMeterResetAction, zwaveMeterResetSchema)
    this.scenariiService.registerElementType('zwave-siren-6-tones-action', ServerZwaveSiren6TonesAction, zwaveSiren6TonesSchema)

    // Register scenarii triggers
    ServerZwaveBinarySwitchStateTrigger.logger = this.logger
    ServerZwaveBinarySwitchStateTrigger.zwaveService = this
    ServerZwaveInstantEnergyLimitTrigger.logger = this.logger
    ServerZwaveInstantEnergyLimitTrigger.zwaveService = this
    ServerZwaveEnergyConsumptionLimitTrigger.logger = this.logger
    ServerZwaveEnergyConsumptionLimitTrigger.zwaveService = this
    ServerZwaveBatteryLevelTrigger.logger = this.logger
    ServerZwaveBatteryLevelTrigger.zwaveService = this
    ServerZwaveDeadNodeTrigger.logger = this.logger
    ServerZwaveDeadNodeTrigger.zwaveService = this
    ServerZwaveCentralSceneTrigger.logger = this.logger
    ServerZwaveCentralSceneTrigger.zwaveService = this
    ServerZwaveTemperatureTrigger.logger = this.logger
    ServerZwaveTemperatureTrigger.zwaveService = this
    ServerZwaveAlarmTrigger.logger = this.logger
    ServerZwaveAlarmTrigger.zwaveService = this
    this.scenariiService.registerElementType('zwave-binary-switch-state-trigger', ServerZwaveBinarySwitchStateTrigger, zwaveBinarySwitchStateTriggerSchema)
    this.scenariiService.registerElementType('zwave-instant-energy-limit-trigger', ServerZwaveInstantEnergyLimitTrigger, zwaveInstantEnergyLimitTriggerSchema)
    this.scenariiService.registerElementType('zwave-energy-consumption-limit-trigger', ServerZwaveEnergyConsumptionLimitTrigger, zwaveEnergyConsumptionLimitTriggerSchema)
    this.scenariiService.registerElementType('zwave-battery-level-trigger', ServerZwaveBatteryLevelTrigger, zwaveBatteryLevelTriggerSchema)
    this.scenariiService.registerElementType('zwave-dead-node-trigger', ServerZwaveDeadNodeTrigger, zwaveDeadNodeTriggerSchema)
    this.scenariiService.registerElementType('zwave-central-scene-trigger', ServerZwaveCentralSceneTrigger, zwaveCentralSceneTriggerSchema)
    this.scenariiService.registerElementType('zwave-temperature-trigger', ServerZwaveTemperatureTrigger, zwaveTemperatureTriggerSchema)
    this.scenariiService.registerElementType('zwave-alarm-trigger', ServerZwaveAlarmTrigger, zwaveAlarmTriggerSchema)

    // Register scenarii conditions
    ServerZwaveBatteryLevelCondition.logger = this.logger
    ServerZwaveBatteryLevelCondition.zwaveService = this
    ServerZwaveEnergyConsumptionCondition.logger = this.logger
    ServerZwaveEnergyConsumptionCondition.zwaveService = this
    ServerZwaveInstantEnergyCondition.logger = this.logger
    ServerZwaveInstantEnergyCondition.zwaveService = this
    ServerZwaveBinarySwitchStateCondition.logger = this.logger
    ServerZwaveBinarySwitchStateCondition.zwaveService = this
    ServerZwaveTemperatureCondition.logger = this.logger
    ServerZwaveTemperatureCondition.zwaveService = this
    ServerZwaveAlarmCondition.logger = this.logger
    ServerZwaveAlarmCondition.zwaveService = this
    this.scenariiService.registerElementType('zwave-battery-level-condition', ServerZwaveBatteryLevelCondition, zwaveBatteryLevelConditionSchema)
    this.scenariiService.registerElementType('zwave-energy-consumption-condition', ServerZwaveEnergyConsumptionCondition, zwaveEnergyConsumptionConditionSchema)
    this.scenariiService.registerElementType('zwave-instant-energy-condition', ServerZwaveInstantEnergyCondition, zwaveInstantEnergyConditionSchema)
    this.scenariiService.registerElementType('zwave-binary-switch-state-condition', ServerZwaveBinarySwitchStateCondition, zwaveBinarySwitchStateConditionSchema)
    this.scenariiService.registerElementType('zwave-temperature-condition', ServerZwaveTemperatureCondition, zwaveTemperatureConditionSchema)
    this.scenariiService.registerElementType('zwave-alarm-condition', ServerZwaveAlarmCondition, zwaveAlarmConditionSchema)
  }

  reset () {
    this.nodes = []
  }

  _nodeAdded (context, nodeId) {
    if (!this.nodes.find(n => n.nodeid === nodeId)) {
      this.nodes.push({
        nodeid: nodeId,
        manufacturerid: '',
        producttype: '',
        productid: '',
        overrideProduct: null,
        classes: {},
        ready: undefined,
        removed: false
      })

      this.dataHandler.getItem(`zwave-node-${nodeId}-data`)
        .then((data) => {
          const node = this.nodes.find(n => n.nodeid === nodeId)
          if (data) {
            if (node.manufacturerid === '') {
              node.manufacturerid = data.manufacturerid
            }
            if (node.producttype === '') {
              node.producttype = data.producttype
            }
            if (node.productid === '') {
              node.productid = data.productid
            }
            node.overrideProduct = data.overrideProduct
          }

          /* if (node.overrideProduct && products[node.overrideProduct] && products[node.overrideProduct].meta &&
            products[node.overrideProduct].meta.neverReady) {
            this.logger.info(`Zwave node #${nodeId} never sends ready signal. Force object mounting.`)
            const ProductClass = _getProductClass(node)
            node.object = new ProductClass(node, context)
          } */
        })
        .catch((error) => {
          this.logger.info(`Zwave node #${nodeId} discovered but never seen before.`)
          console.error(error)
        })

      this.logger.info(`Zwave 'node added': node #${nodeId} discovered.`)
      return true
    }

    throw new Error(`Zwave 'node added': the nodeId #${nodeId} already exists!`)
  }

  _classValueChanged (nodeId, comClass, value) {
    const node = this.nodes.find(n => n.nodeid === nodeId)
    if (node) {
      if (!node.classes[comClass]) {
        node.classes[comClass] = {}
      }
      if (!node.classes[comClass][value.index]) {
        node.classes[comClass][value.index] = {}
      }
      node.classes[comClass][value.index][value.instance] = value

      if (node.object && node.object.classValueChanged) {
        node.object.classValueChanged(comClass, value)
      }

      const lightValue = { class_id: value.class_id, instance: value.instance, index: value.index, label: value.label, value: value.value }
      this.logger.log(`Zwave 'value changed' for node #${nodeId}: ${JSON.stringify(lightValue)}.`)
      return true
    }

    throw new Error(`Zwave 'value changed': the nodeId #${nodeId} was not found!`)
  }

  _classValueRemoved (nodeId, comClass, index) {
    const node = this.nodes.find(n => n.nodeid === nodeId)
    if (node) {
      if (node.classes[comClass] && node.classes[comClass][index]) {
        delete node.classes[comClass][index]
      }

      if (node.object && node.object.classValueRemoved) {
        node.object.classValueRemoved(comClass, index)
      }

      this.logger.log(`Zwave 'value removed' for node #${nodeId}: class ${comClass}, index ${index}.`)
      return true
    }

    throw new Error(`Zwave 'value removed': the nodeId #${nodeId} was not found!`)
  }

  _nodeReady (ready, context, nodeId, nodeInfo) {
    const node = this.nodes.find(n => n.nodeid === nodeId)
    if (node) {
      Object.assign(node, nodeInfo, { ready })

      if (ready !== false) {
        if (ready === true) {
          this.logger.info(`Zwave 'node ready': node #${nodeId} ready to be used.`)
        }
        if (ready === undefined) {
          this.logger.info(`Zwave 'node ready': node #${nodeId} ready state unknown.`)
        }

        if (!node.object) {
          const ProductClass = _getProductClass(node)
          if (ready === true || (ready === undefined && ProductClass.meta && ProductClass.meta.passive)) {
            node.object = new ProductClass(node, context)
          }
        }

        this.dataHandler.getItem(`zwave-node-${nodeId}-data`)
          .then((item) => {
            this.dataHandler.setItem(`zwave-node-${nodeId}-data`, {
              ...(item || {}),
              manufacturerid: node.manufacturerid,
              producttype: node.producttype,
              productid: node.productid,
              overrideProduct: node.overrideProduct
            })
          })
          .catch((error) => {
            this.logger.warning(`Zwave node #${nodeId} cannot be stored into database.`)
            console.error(error)
          })
      }

      this.sendRefreshNeededSignal()
      return true
    }

    throw new Error(`Zwave 'node naming/available/ready': the nodeId #${nodeId} was not added!`)
  }

  _nodeRemoved (nodeId) {
    const node = this.nodes.find(n => n.nodeid === nodeId)
    if (node) {
      node.ready = false
      node.removed = true

      if (node.object && node.object.beforeDestroy) {
        node.object.beforeDestroy()
      }
      delete node.object

      this.dataHandler.removeItem(`zwave-node-${nodeId}-data`)
      .catch((error) => {
        this.logger.warning(`Zwave node #${nodeId} cannot be removed from database.`)
        console.error(error)
      })

      this.logger.info(`Zwave 'node removed': node #${nodeId} unactivated.`)
      this.sendRefreshNeededSignal()
      return true
    }

    throw new Error(`Zwave 'node removed': the nodeId #${nodeId} was not found!`)
  }

  _notification (nodeId, notification) {
    const node = this.nodes.find(n => n.nodeid === nodeId)
    if (node) {
      switch (notification) {
        // case 0: message complete
        // case 1: timeout
        // case 2: nop
        // case 3: node awake
        // case 4: node sleep
        case 5: // node dead
          Object.assign(node, { ready: false })
          this.sendRefreshNeededSignal()
          break
        // case 6: node alive
      }

      if (node.object && node.object.notification) {
        node.object.notification(notification)
      }

      this.logger.log(`Zwave 'notification' for node #${nodeId}: ${UnknownProduct.notifications._list[notification]}.`)
      return true
    }

    throw new Error(`Zwave 'notification': the nodeId #${nodeId} was not found! notification: ${notification}.`)
  }

  _nodeEvent (nodeId, ...data) {
    const node = this.nodes.find(n => n.nodeid === nodeId)
    if (node) {
      if (node.object && node.object.nodeEvent) {
        node.object.nodeEvent(data)
      }

      this.logger.log(`Zwave 'node event' for node #${nodeId}: ${JSON.stringify(data)}`)
      return true
    }

    throw new Error(`Zwave 'node event': the nodeId #${nodeId} was not found!`)
  }

  _otherEvent (numb, context, nodeId, data) {
    const node = this.nodes.find(n => n.nodeid === nodeId)
    if (node) {

      /*if (node.object && node.object.???Event) {
        node.object.???Event(data)
      }*/

      // This is useful to see if other specialized event should be listened for new features.
      this.logger.log(`Zwave '???' for node #${nodeId}: ${numb} / ${data}`)
      return true
    }

    throw new Error(`Zwave '???': the nodeId #${nodeId} was not found! ${data}.`)
  }

  /**
   * Get a node object from its ID. The node must be ready or passive.
   *
   * @param nodeId
   * @returns {Object} An product class instance (see ./products/*)
   */
  getNodeById (nodeId, serializable = false) {
    const node = this.nodes.find((n) => (n.nodeid === nodeId && /*(n.ready !== undefined) &&*/ !n.removed))

    if (!node) {
      return null
    }

    return serializable ? {
      location: node.object ? node.object.getLocation() : '',
      name: node.object ? node.object.getName() : _getProductClass(node).meta.name(node.nodeid),
      nodeid: node.nodeid,
      ready: node.ready,
      meta: _getProductClass(node).meta,
      battery: (node.object && node.object.batteryLevelGetPercent) ? { percent: node.object.batteryLevelGetPercent(), icon: node.object.batteryLevelGetIcon() } : null,
      overrideProduct: node.overrideProduct,
      configurations: (node.classes && node.classes['112']) ? Object.entries(node.classes['112']).map(([k, v]) => {
        return { index: k, type: v['1'].type, label: v['1'].label, units: v['1'].units, help: v['1'].help,
          min: v['1'].min, max: v['1'].max, values: v['1'].values
        }
      }) : []
    } : node.object
  }

  /**
   * Get a list of public declared functions from the node object class.
   * Used to build a proxy on browser side service.
   * @param nodeId
   * @returns {Array[String]} a list of available functions
   */
  getNodeSettingPanelProvidedFunctions (nodeId) {
    const nodeObject = this.getNodeById(nodeId)
    if (!nodeObject) {
      return null
    }

    return nodeObject.constructor.meta.settingPanelProvidedFunctions || []
  }

  callNodeProvidedFunction (nodeId, functionName, args) {
    const nodeObject = this.getNodeById(nodeId)
    if (!nodeObject) {
      return Promise.reject(new Error('Node not found.'))
    }

    return Promise.resolve()
    .then(() => {
      if (!nodeObject[functionName]) {
        throw new Error('Provided function does not exists.')
      }

      return nodeObject[functionName].apply(nodeObject, args)
    })
  }

  /**
   * Get a list of nodes ready to be used (ready state or dead/sleeping nodes that where ready before).
   *
   * @returns {[Object]} An array of product class instances (see ./products/*)
   */
  getNodes (providedFunctions = [], serializable = false) {
    const nodes = this.nodes.filter((n) => {
      const meta = _getProductClass(n).meta
      return (
        // n.ready !== undefined &&     // REMOVED: usefull for passive nodes, like battery powered wall controller
        !n.removed &&
        providedFunctions.every((func) => (meta.settingPanelProvidedFunctions || []).includes(func))
      )
    })
    return nodes.map((n) => serializable ? {
      location: n.object ? n.object.getLocation() : '',
      name: n.object ? n.object.getName() : _getProductClass(n).meta.name(n.nodeid),
      nodeid: n.nodeid,
      ready: n.ready,
      meta: _getProductClass(n).meta,
      battery: (n.object && n.object.batteryLevelGetPercent) ? { percent: n.object.batteryLevelGetPercent(), icon: n.object.batteryLevelGetIcon() } : null,
      overrideProduct: n.overrideProduct
    } : n.object)
  }

  changeStandardProductSupport (nodeId, productSupport) {
    const node = this.nodes.find(n => n.nodeid === nodeId)

    node.overrideProduct = productSupport
    const ProductClass = _getProductClass(node)
    node.object = new ProductClass(node, this.context)

    return this.dataHandler.setItem(`zwave-node-${nodeId}-data`, {
      manufacturerid: node.manufacturerid,
      producttype: node.producttype,
      productid: node.productid,
      overrideProduct: node.overrideProduct
    })
      .then(() => {
        this.sendRefreshNeededSignal()
        return true
      })
      .catch((error) => {
        this.logger.warning(`Zwave node #${nodeId} cannot be stored into database.`)
        console.error(error)
      })
  }

  persistConfiguration () {
    this.logger.log('Writing Zwave config...')
    try {
      // this.context.zwave.writeConfig()
      // XXX this is deprecated: replace when other method available & needed, or remove it!
    } catch (error) {
      this.logger.warn('Error writing Zwave config to persistent file!', error)
      throw error
    }
  }

  updateAlarmsToNotify (alarmsToUpdate) {
    alarmsToUpdate.forEach(({ node, status, value }) => {
      const alarmIsOn = status.shift()
      const key = value.value_id
      this.alarms[key] = { alarmIsOn, status, node }
    })

    const alarmsOn = Object.entries(this.alarms) // .filter(([key, alarm]) => alarm.alarmIsOn)
    if (alarmsOn.length > 0) {
      this.logger.warn('Zwave alarms notified.', alarmsOn)
    }
    this.updateNotification(alarmsOn)
  }

  removeNode (nodeId) {
    if (this.context.zwave.hasNodeFailed(nodeId)) {
      this.context.zwave.removeFailedNode(nodeId)
      return Promise.resolve()
    }

    return Promise.reject()
  }

  getAlarms () {
    return Object.entries(this.alarms).filter(([key, alarm]) => alarm.alarmIsOn).map(([key, alarm]) => {
      const n = alarm.node
      alarm.node = {
        location: n.object ? n.object.getLocation() : '',
        name: n.object ? n.object.getName() : _getProductClass(n).meta.name(n.nodeid),
        nodeid: n.nodeid,
        ready: n.ready,
        meta: _getProductClass(n).meta,
        battery: (n.object && n.object.batteryLevelGetPercent) ? { percent: n.object.batteryLevelGetPercent(), icon: n.object.batteryLevelGetIcon() } : null,
        overrideProduct: n.overrideProduct
      }
      return [key, alarm]
    })
  }
}

export default ZwaveService
