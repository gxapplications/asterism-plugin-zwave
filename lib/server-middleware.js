'use strict'

import express from 'express'
import OpenZWave from 'openzwave-shared'
import os from 'os'
import path from 'path'

import ZwaveService from './server-service'

const _defaultDriverPaths = {
  darwin: '/dev/cu.usbmodem1411',
  linux: '/dev/ttyACM0',
  windows: '\\\\.\\COM3'
}
const _commonDriverPaths = {
  '/dev/ttyACM0': null,
  '/dev/ttyUSB0': null,
  '\\\\.\\COM3': null,
  '/dev/cu.usbmodem1411': null
}

const zwave = new OpenZWave({
  UserPath: path.join(__dirname, '..', 'open-zwave'),
  SaveConfiguration: true,
  ConsoleOutput: false
})

let _workingDriverPath = null
let _testingDriverPath = _defaultDriverPaths[os.platform()]
let _currentConnectionState = 0 // -1: error, 0: disconnected, 1: connecting, 2: driver ready (scan begins), 3: scan complete

const zwaveServerMiddleware = (context) => {
  const { dataHandler, logger, notificationHandler } = context
  const router = express.Router()
  let zwaveService = null
  let zwaveConfigAutoWriter = null
  let alarmsToNotify = false

  const updateNotification = (alarms = undefined) => {
    // Push a message to web workers (Browsers)
    if (alarms !== undefined) {
      alarmsToNotify = alarms.filter(([key, alarm]) => { // Warning: side effect filter!
        if (!alarm.alarmIsOn && (!alarmsToNotify || !alarmsToNotify.find(([k, a]) => k === key))) {
          return false // if alarm is Off and was not previously On, do not notify once more.
        }

        const location = alarm.node.loc ||
          alarm.node.location ||
          (alarm.node.getLocation && alarm.node.getLocation()) ||
          alarm.node.object?.loc ||
          alarm.node.object?.location ||
          (alarm.node.object?.getLocation && alarm.node.object.getLocation())
        const name = location ? `${alarm.node.name} @ ${location}` : alarm.node.name
        const statuses = alarm.status.length > 1 ? `[${alarm.status.join(', ')}]` : alarm.status || ''
        notificationHandler.pushNotificationMessage(
          'Asterism Z-Wave alarm',
          `Alarm ${alarm.alarmIsOn ? 'raised' : 'ended'} on ${name}: ${statuses}.`,
          alarm.alarmIsOn ? 'warning' : 'info',
          alarm.alarmIsOn ? { tag: key, renotify: true } : { tag: key, silent: true, renotify: false }
        )

        return alarm.alarmIsOn
      })
    }

    // Updates zwave icon in header
    notificationHandler.setNotification(
      'controller-state',
      (_currentConnectionState <= 2) ? 'zwave-off' : 'zwave-on',
      (_currentConnectionState <= 0) ? 'error' : (alarmsToNotify && alarmsToNotify.length ? 'warning' : ''),
      (socket) => {
        if (socket) {
          const privateSocketForClient = socket.client.sockets[`${context.privateSocketIo.name}#${socket.client.id}`]
          if (_currentConnectionState < 2) {
            privateSocketForClient.emit('zwave-notification-open-settings')
          } else {
            if (alarmsToNotify && alarmsToNotify.length) {
              privateSocketForClient.emit('zwave-notification-open-alarms-panel')
            } else {
              privateSocketForClient.emit('zwave-notification-open-edit-panel')
            }
          }
        }
        return 'ok'
      }
    )
  }

  const sendRefreshNeededSignal = () => {
    context.privateSocketIo.emit('refresh-needed')
  }

  const _connectController = (path = _testingDriverPath) => {
    logger.info(`Connecting zwave controller from device ${path} (OS ${os.platform()})...`)
    if (zwaveService) {
      zwaveService.reset()
    }
    zwave.connect(path)
    _testingDriverPath = path
    _currentConnectionState = 1
    updateNotification()
  }

  const _disconnectController = () => {
    if (zwaveConfigAutoWriter) {
      clearInterval(zwaveConfigAutoWriter)
    }
    logger.warn(`Disconnecting zwave controller from device ${_workingDriverPath || _testingDriverPath}...`)
    context.privateSocketIo.emit('controller-driver-disconnect')
    zwave.disconnect(_workingDriverPath || _testingDriverPath)
    _currentConnectionState = 0
    updateNotification()
  }

  const reconnectController = (path = _testingDriverPath) => {
    _disconnectController()
    _connectController(path)
  }

  const _plugSocketListeners = (socket) => {
    socket.on('controller-get-paths', (ack) => {
      ack({
        commonDriverPaths: _commonDriverPaths,
        workingDriverPath: _workingDriverPath,
        initialState: _currentConnectionState
      })
    })
    socket.on('controller-reconnect', (path, ack) => {
      reconnectController(path)
      ack(true)
    })
    socket.on('controller-rescan', (ack) => {
      if (_workingDriverPath) {
        reconnectController(_workingDriverPath)
        ack(true)
      } else {
        ack(false)
      }
    })
    socket.on('controller-get-state', (ack) => {
      ack(_currentConnectionState)
    })
    socket.on('get-nodes', (ack) => {
      ack(zwaveService.getNodes([], true)) // serializable version
    })
    socket.on('get-nodes-by-provided-functions', (providedFunctions, ack) => {
      ack(zwaveService.getNodes(providedFunctions, true)) // serializable version
    })
    socket.on('get-node-by-id', (nodeId, ack) => {
      ack(zwaveService.getNodeById(parseInt(nodeId), true)) // serializable version
    })
    socket.on('get-node-settings-panel-provided-functions', (nodeId, ack) => {
      ack(zwaveService.getNodeSettingPanelProvidedFunctions(parseInt(nodeId)))
    })
    socket.on('call-node-public-function', (nodeId, functionName, args, ack) => {
      zwaveService.callNodeProvidedFunction(parseInt(nodeId), functionName, args)
        .then(ack)
    })
    socket.on('set-node-product-support', (nodeId, productSupport, ack) => {
      zwaveService.changeStandardProductSupport(parseInt(nodeId), productSupport)
        .then(ack)
    })
    socket.on('remove-node', (nodeId, ack) => {
      zwaveService.removeNode(parseInt(nodeId))
        .then(ack)
    })
    socket.on('get-alarms', (ack) => {
      ack(zwaveService.getAlarms()) // serializable version
    })
    updateNotification()
  }

  const _plugControllerListeners = () => {
    zwave.on('driver ready', (homeId) => {
      logger.info(`Zwave controller ready to scan. Home ID ${homeId}`)
      context.privateSocketIo.emit('controller-driver-ready')
      _currentConnectionState = 2
      updateNotification()
    })
    zwave.on('driver failed', () => {
      logger.warn(`Zwave controller not responding on path ${_testingDriverPath}.`)

      if (_testingDriverPath === '/dev/ttyACM0') {
        logger.info('Trying to connect controller from path /dev/ttyACM1')
        return _connectController('/dev/ttyACM1')
      }

      context.privateSocketIo.emit('controller-driver-failure')
      _currentConnectionState = -1
      updateNotification()
    })
    zwave.on('scan complete', () => {
      logger.info('Zwave controller scan complete! Controller connected!')
      _workingDriverPath = _testingDriverPath
      dataHandler.setItem('controller-driver-path', _workingDriverPath)
      context.privateSocketIo.emit('controller-driver-scan-complete')
      _currentConnectionState = 3
      updateNotification()

      // persist config in cache file every 10 minutes
      if (zwaveService) {
        zwaveService.persistConfiguration()
        zwaveConfigAutoWriter = setInterval(() => {
          if (zwaveService) {
            try {
              zwaveService.persistConfiguration()
            } catch (error) {
              clearInterval(zwaveConfigAutoWriter)
            }
          } else {
            clearInterval(zwaveConfigAutoWriter)
          }
        }, 600000) // 10 minutes
      }
    })
  }

  router.connectPlugin = (getServices) => {
    zwaveService = new ZwaveService({
      getServices,
      zwave,
      dataHandler,
      logger,
      privateSocketIo: context.privateSocketIo,
      updateNotification,
      reconnectController,
      sendRefreshNeededSignal
    })

    context.privateSocketIo.on('connect', (socket) => {
      // this connects only when private socket is connected from browser: when settings panel is built.
      _plugSocketListeners(socket)
    })
    _plugControllerListeners()
    dataHandler.getItem('controller-driver-path')
      .then((item) => {
        _testingDriverPath = item || _testingDriverPath
        _connectController()
      })

    return zwaveService
  }

  router.disconnectPlugin = () => {
    _disconnectController()
  }

  return router
}

export default zwaveServerMiddleware
