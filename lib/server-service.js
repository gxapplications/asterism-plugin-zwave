'use strict'

import express from 'express'
import OpenZWave from 'openzwave-shared'
import os from 'os'
import path from 'path'

import products from './products'
import UnknownProduct from './products/unknown'

import ServerZwaveBinarySwitchAction from './scenarii/binary-switch-action/server'
import zwaveBinarySwitchSchema from './scenarii/binary-switch-action/schema'

const _getProductClass = (node) => {
  const manufacturerid = node.manufacturerid.replace(/^0x/, '')
  const producttype = node.producttype.replace(/^0x/, '')
  const productid = node.productid.replace(/^0x/, '')
  return products[`${manufacturerid}-${producttype}-${productid}`] || UnknownProduct
}

class ZwaveService {
  constructor ({ getServices, zwave, dataHandler, logger, privateSocketIo, sendRefreshNeededSignal }) {
    this.nodes = []
    this.dataHandler = dataHandler
    this.logger = logger,
    this.sendRefreshNeededSignal = sendRefreshNeededSignal

    zwave.on('node added', this._nodeAdded.bind(this))
    zwave.on('node naming', this._nodeReady.bind(this, undefined, { zwave, dataHandler, logger, privateSocketIo }))
    zwave.on('node available', this._nodeReady.bind(this, undefined, { zwave, dataHandler, logger, privateSocketIo }))
    zwave.on('node ready', this._nodeReady.bind(this, true, { zwave, dataHandler, logger, privateSocketIo }))
    zwave.on('node removed', this._nodeRemoved.bind(this))

    zwave.on('value added', this._classValueChanged.bind(this))
    zwave.on('value changed', this._classValueChanged.bind(this))
    zwave.on('value refreshed', this._classValueChanged.bind(this))
    zwave.on('value removed', this._classValueRemoved.bind(this))
    zwave.on('notification', this._notification.bind(this))

    zwave.on('controller command', (nodeId, ctrlState, ctrlError, helpmsg) => {
      console.log('controller command feedback: nodeId=%d, ctrlState=%d, ctrlError=%d, helpmsg=%d', nodeId, ctrlState, ctrlError, helpmsg) // TODO !9: what to do with it?
    })

    // other events: "node event", "node reset", "polling disabled", "polling enabled", "scene event", "create button", "delete button", "button on", "button off"

    // Register scenarii actions
    this.scenariiService = getServices()['asterism-scenarii']
    ServerZwaveBinarySwitchAction.logger = this.logger
    ServerZwaveBinarySwitchAction.zwaveService = this
    this.scenariiService.registerElementType('zwave-binary-switch-action', ServerZwaveBinarySwitchAction, zwaveBinarySwitchSchema)
  }

  reset () {
    this.nodes = []
  }

  _nodeAdded (nodeId) {
    if (!this.nodes.find(n => n.nodeid === nodeId)) {
      this.nodes.push({
        nodeid: nodeId,
        manufacturerid: '',
        producttype: '',
        productid: '',
        classes: {},
        ready: undefined,
        removed: false
      })

      this.dataHandler.getItem(`zwave-node-${nodeId}-data`)
      .then((data) => {
        const node = this.nodes.find(n => n.nodeid === nodeId)
        if (data && node.manufacturerid === '') {
          node.manufacturerid = data.manufacturerid
        }
        if (data && node.producttype === '') {
          node.producttype = data.producttype
        }
        if (data && node.productid === '') {
          node.productid = data.productid
        }
      })
      .catch((error) => {
        this.logger.info(`Zwave node #${nodeId} discovered but never seen before.`)
        console.error(error)
      })

      this.logger.info(`Zwave 'node added event': node #${nodeId} discovered.`)
      return true
    }

    throw new Error(`Zwave 'node added event': the nodeId #${nodeId} already exists!`)
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

      this.logger.log(`Zwave 'value added/changed events' for node #${nodeId}: class ${comClass}, ${JSON.stringify(value)}.`)
      return true
    }

    throw new Error(`Zwave 'value added/changed events': the nodeId #${nodeId} was not found!`)
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

      this.logger.log(`Zwave 'value removed event' for node #${nodeId}: class ${comClass}, index ${index}.`)
      return true
    }

    throw new Error(`Zwave 'value removed events': the nodeId #${nodeId} was not found!`)
  }

  _nodeReady (ready, context, nodeId, nodeInfo) {
    const node = this.nodes.find(n => n.nodeid === nodeId)
    if (node) {
      Object.assign(node, nodeInfo, { ready })

      if (ready) {
        this.logger.info(`Zwave 'node ready event': node #${nodeId} ready to be used.`)
        
        if (!node.object) {
          const ProductClass = _getProductClass(node)
          node.object = new ProductClass(node, context)
        }

        this.dataHandler.setItem(`zwave-node-${nodeId}-data`, {
          manufacturerid: node.manufacturerid,
          producttype: node.producttype,
          productid: node.productid
        })
        .catch((error) => {
          this.logger.warning(`Zwave node #${nodeId} cannot be stored into database.`)
          console.error(error)
        })
      }

      this.sendRefreshNeededSignal()
      return true
    }

    throw new Error(`Zwave 'node naming/available/ready events': the nodeId #${nodeId} was not added!`)
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

      this.logger.info(`Zwave 'node removed event': node #${nodeId} unactivated.`)
      this.sendRefreshNeededSignal()
      return true
    }

    throw new Error(`Zwave 'node removed event': the nodeId #${nodeId} was not found!`)
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
        case 5:
          Object.assign(node, { ready: false })
          this.sendRefreshNeededSignal()
          break
        // case 6: node alive
      }

      if (node.object && node.object.notification) {
        node.object.notification(notification)
      }

      this.logger.log(`Zwave 'notification event' for node #${nodeId}: ${UnknownProduct.notifications._list[notification]}.`)
      return true
    }

    throw new Error(`Zwave 'notification event': the nodeId #${nodeId} was not found! notification: ${notification}.`)
  }

  /**
   * Get a node object from its ID. The node must be ready!
   *
   * @param nodeId
   * @returns {Object} An product class instance (see ./products/*)
   */
  getNodeById (nodeId) {
    const node = this.nodes.find((n) => (n.nodeid === nodeId && n.ready && !n.removed))
    return node ? node.object : null
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
        n.ready !== undefined &&
        !n.removed &&
        providedFunctions.every((func) => (meta.settingPanelProvidedFunctions || []).includes(func))
      )
    })
    return nodes.map((n) => serializable ? {
      location: n.object ? n.object.getLocation() : '',
      name: n.object ? n.object.getName() : _getProductClass(n).meta.name(n.nodeid),
      nodeid: n.nodeid,
      ready: n.ready,
      meta: _getProductClass(n).meta
    } : n.object)
  }
}

export default ZwaveService
