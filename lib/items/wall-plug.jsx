'use strict'

import Chart from 'chart.js'
import cx from 'classnames'
import React from 'react'
import { Button, Icon } from 'react-materialize'
import uuid from 'uuid'

import { Item } from 'asterism-plugin-library'

class WallPlugItem extends Item {
  constructor (props) {
    super(props)

    this.state.node = null
    this.state.productObjectProxy = null
    this.state.energyLevel = null
    this.state.energyHistory = null
    this.state.switchState = null
    this.state.meterLastValue = null
    this.state.process = false
    this.state.costLastValue = null

    this._socket = props.context.privateSocket
    this.zwaveService = props.context.services['asterism-plugin-zwave']

    this.receiveNewParams(this.state.params)
  }

  receiveNewParams (params) {
    this.zwaveService.getProductObjectProxyForNodeId(params.nodeId)
    .then((productObjectProxy) => {
      Promise.all([
        this.zwaveService.getNodeById(params.nodeId),
        productObjectProxy.binarySwitchGetState ? productObjectProxy.binarySwitchGetState() : null,
        productObjectProxy.meterGetLastValue ? productObjectProxy.meterGetLastValue() : null,
        productObjectProxy.sensorMultiLevelGetValue ? productObjectProxy.sensorMultiLevelGetValue() : null,
        productObjectProxy.sensorMultiLevelGetHistory ? productObjectProxy.sensorMultiLevelGetHistory() : null,
        productObjectProxy.energyConsumptionMeterGetLastCost ? productObjectProxy.energyConsumptionMeterGetLastCost() : null,
      ])
      .then(([node, switchState, meterLastValue, energyLevel, energyHistory, costLastValue]) => {
        this.setState({
          params, node, productObjectProxy,
          switchState,
          meterLastValue: meterLastValue ? meterLastValue.v : '--',
          energyLevel,
          energyHistory,
          costLastValue
        })

        this.updateChart(energyHistory)
      })
      .catch((error) => {
        console.error(error)
        this.setState({ process: error })
      })
    })
  }

  componentDidMount () {
    this._mounted = true

    this._socket.on('node-event-meter-changed', (nodeId, value) => {
      if (this.state.params.nodeId != nodeId) { // eslint-disable-line eqeqeq
        return
      }

      if (this._mounted) {
        if (this.state.meterLastValue !== value.value) {
          this.setState({
            meterLastValue: value.value
          })
        }
        if (this.state.productObjectProxy.sensorMultiLevelGetHistory) {
          this.state.productObjectProxy.sensorMultiLevelGetHistory()
          .then((energyHistory) => {
            this.setState({ energyHistory })
            this.updateChart(energyHistory)
          })
        }
      }
    })
    this._socket.on('node-event-binary-switch-changed', (nodeId, value) => {
      if (this.state.params.nodeId != nodeId) { // eslint-disable-line eqeqeq
        return
      }

      if (this._mounted) {
        if (this.state.switchState !== value.value) {
          this.setState({
            switchState: value.value
          })
        }
      }
    })
    this._socket.on('node-event-sensor-multi-level-changed', (nodeId, value) => {
      if (this.state.params.nodeId != nodeId) { // eslint-disable-line eqeqeq
        return
      }

      if (this._mounted) {
        if (this.state.energyLevel !== value.value) {
          this.setState({
            energyLevel: value.value
          })
          if (this.state.productObjectProxy.sensorMultiLevelGetHistory) {
            this.state.productObjectProxy.sensorMultiLevelGetHistory()
            .then((energyHistory) => {
              this.setState({ energyHistory })
              this.updateChart(energyHistory)
            })
          }
        }
      }
    })
    this._socket.on('controller-driver-scan-complete', () => {
      if (this._mounted) {
        this.receiveNewParams(this.state.params)
      }
    })
  }

  componentWillUnmount () {
    this._mounted = false
  }

  render () {
    const { node, energyLevel, energyHistory, switchState, meterLastValue, process, costLastValue } = this.state
    const { title = '', icon = 'power', color = 'secondary', showPower = true, showConsumption = true } = this.state.params
    const { mainState, theme } = this.props.context
    const { animationLevel } = mainState()
    const energyLevelCompatible = node ? (showPower && node.meta.settingPanelProvidedFunctions.includes('sensorMultiLevelGetValue') && energyLevel) : false
    const meterCompatible = node ? (
      showConsumption && node.meta.settingPanelProvidedFunctions.includes('meterGetLastValue') && meterLastValue &&
      node.meta.settingPanelProvidedFunctions.includes('sensorMultiLevelGetHistory')  && energyHistory
    ) : false
    const costCompatible = node ? (
      meterCompatible && costLastValue &&
      node.meta.settingPanelProvidedFunctions.includes('energyConsumptionMeterGetLastCost')
    ) : false

    const energyClass = switchState ? (energyLevelCompatible ? this.getEnergyLevelClass(energyLevel) : 'w0') : ''
    const buttonClass = (process === true) ? theme.feedbacks.progressing : (process ? theme.feedbacks.error : theme.actions[color])

    return (
      <Button key={this.props.id} waves={animationLevel >= 2 ? 'light' : null}
        className={cx(buttonClass, 'truncate fluid WallPlug')} onClick={this.click.bind(this)}
      >

        {node ? (
          <div className={cx('PowerRing', energyClass)}>
            {energyLevelCompatible ? (<span>{energyLevel}<br />w</span>) : null}
          </div>
        ) : null}

        {meterCompatible && meterLastValue ? (
          <div className='energyGraph'>
            {energyHistory.length ? (
              <canvas id={`wall-plug-chart-${this.props.id}`} className='chart'></canvas>
            ) : null}
            <div className='meterLasValue'>
              {meterLastValue} kWh
              {costCompatible ? (
                <span>&nbsp;({Number.parseFloat(costLastValue).toFixed(2)} ¤)</span>
              ) : null}
            </div>
          </div>
        ) : null}

        <Icon left>{icon}</Icon>
        <span>{title}</span>
      </Button>
    )
  }

  getEnergyLevelClass (power) {
    if (power < 50) {
      return 'w0'
    }
    if (power < 150) {
      return 'w100'
    }
    if (power < 300) {
      return 'w200'
    }
    if (power < 700) {
      return 'w400'
    }
    if (power < 1400) {
      return 'w1000'
    }
    if (power < 2150) {
      return 'w1800'
    }
    if (power < 2750) {
      return 'w2500'
    }
    return 'w3000'
  }

  updateChart (data) {
    if (!data || !data.length || data.length <= 2) {
      return
    }
    // http://www.chartjs.org/docs/latest

    const element = document.getElementById(`wall-plug-chart-${this.props.id}`)
    if (data.length && element) {
      const ctx = element.getContext('2d')
      new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [{
            data: data.map((d) => ({ t: d.t, y: d.v })).slice(0, 128),
            pointRadius: 0
          }]
        },
        options: {
          fill: 'start',
          legend: {
            display: false,
          },
          scales: {
            yAxes: [{
              display: false,
              beginAtZero: true,
              ticks: {
                suggestedMax: 5 // min amplitude in Watts: 5W
              }
            }],
            xAxes: [{
              type: 'time',
              display: false
            }]
          },
          elements: {
            line: {
              tension: 1
            }
          },
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 10,
              bottom: -26
            }
          },
          animation: {
            duration: 0
          },
          hover: {
            animationDuration: 0
          },
          responsiveAnimationDuration: 0,
          responsive: true,
          maintainAspectRatio: false
        }
      })
    }
  }

  click () {
    if (!this.state.productObjectProxy) {
      return
    }

    this.setState({ process: true })
    this.state.productObjectProxy.binarySwitchInvert()
    .then(() => {
      this.setState({ process: false })
    })
    .catch((error) => {
      console.error(error)
      this.setState({ process: error })
    })
  }
}

export default WallPlugItem
