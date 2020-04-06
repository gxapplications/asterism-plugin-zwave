'use strict'

/* global $, M */
import Chart from 'chart.js'
import cx from 'classnames'
import React from 'react'
import { Button, Icon, Modal } from 'react-materialize'
import uuid from 'uuid'

import { Item } from 'asterism-plugin-library'

class SensorMultiLevelItem extends Item {
  constructor (props) {
    super(props)

    this.state.node = null
    this.state.productObjectProxy = null
    this.state.sensorFormattedValue = '...'
    this.state.modalOpened = false
    this.state.sensorHistory = [
      { t: 1609320150000, v: 3.666667, i: 1, m: 1, M: 5 },
      { t: 1609403010000, v: 3, i: 1, m: 2, M: 6 },
      { t: 1609404170000, v: 2, i: 1, m: 1.5, M: 2 },
      { t: 1609417380000, v: 10, i: 1, m: 10, M: 10 },
      { t: 1609417440000, v: 10, i: 1, m: 10, M: 10 }
    ] // TODO !0: remove this

    this._id = uuid.v4()
    this._bigChart = null
    this._socket = props.context.privateSocket
    this.zwaveService = props.context.services['asterism-plugin-zwave']

    this.receiveNewParams(this.state.params)
  }

  receiveNewParams (params) {
    this.zwaveService.getProductObjectProxyForNodeId(params.nodeId)
    .then((productObjectProxy) => {
      Promise.all([
        this.zwaveService.getNodeById(params.nodeId),
        productObjectProxy.sensorMultiLevelGetFormatted ? productObjectProxy.sensorMultiLevelGetFormatted() : null,
        productObjectProxy.sensorMultiLevelGetHistory ? productObjectProxy.sensorMultiLevelGetHistory() : null
      ])
      .then(([node, sensorFormattedValue, sensorHistory]) => {
        this.setState({
          params, node, productObjectProxy, sensorFormattedValue, //sensorHistory // TODO !0: uncomment this
        })
        this.updateChart(sensorHistory)
      })
      .catch(console.error)
    })

    this.updateChart(this.state.sensorHistory) // TODO !0: remove this
  }

  componentDidMount () {
    this._mounted = true

    $(`#sensor-multi-level-popup-${this._id}`)
      .addClass(this.props.context.theme.actions[this.state.params.color])

    this._socket.on('node-event-sensor-multi-level-changed', (nodeId, value) => {
      if (this.state.params.nodeId != nodeId) { // eslint-disable-line eqeqeq
        return
      }

      this.state.productObjectProxy.sensorMultiLevelGetFormatted()
      .then((sensorFormattedValue) => {
        if (this._mounted) {
          this.setState({
            sensorFormattedValue
          })

          if (this.state.productObjectProxy.sensorMultiLevelGetHistory) {
            this.state.productObjectProxy.sensorMultiLevelGetHistory()
            .then((sensorHistory) => {
              this.setState({ sensorHistory })
              this.updateChart(sensorHistory)
            })
          }
        }
      })
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
    const { sensorFormattedValue, sensorHistory } = this.state
    const { title = '', icon = 'insert_chart_outlined', color = 'secondary' } = this.state.params
    const { mainState, theme } = this.props.context
    const { animationLevel } = mainState()

    return (
      <Button key={this.props.id} waves={animationLevel >= 2 ? 'light' : null}
        className={cx(theme.actions[color], 'truncate fluid SensorMultiLevel')} onClick={this.click.bind(this)}>

        {sensorHistory !== null && (
          <div className='sensorGraph'>
            <canvas id={`sensor-chart-${this._id}`} className='chart' />
          </div>
        )}

        <Icon left>{icon}</Icon>
        <span className='twoLinesButtonTitle'>
          <span>{title}</span>
          <span>{sensorFormattedValue}</span>
        </span>

        <Modal id={`sensor-multi-level-popup-${this._id}`}
          header={title} fixedFooter={true}
          options={{
            dismissible: true,
            inDuration: animationLevel >= 2 ? 300 : 0,
            outDuration: animationLevel >= 2 ? 300 : 0,
            // startingTop: '2%', // TODO !0: wider, more tall. 96% screen ?
            // endingTop: '6%',
            opacity: 0.5,
            preventScrolling: true,
            onOpenStart: () => {
              this.setState({ modalOpened: true })
            },
            onOpenEnd: () => {
              this.updateBigChart(sensorHistory)
            },
            onCloseStart: () => {
              if (this._bigChart) {
                this._bigChart.destroy()
              }
            },
            onCloseEnd: () => {
              this.setState({ modalOpened: false })
            }
          }}
        >
          <div className='SensorMultiLevelGraph'>
            <canvas id={`sensor-big-chart-${this._id}`} className='chart' />
          </div>
        </Modal>
      </Button>
    )
  }

  click () {
    if (!this.state.productObjectProxy) {
      // return // TODO !0: uncomment
    }

    const modal = $(`#sensor-multi-level-popup-${this._id}`)
    if (this.state.modalOpened) {
      return
    }

    modal.modal('open')
  }

  updateChart (data) {
    if (!data || !data.length || data.length <= 2) {
      return
    }
    // http://www.chartjs.org/docs/latest

    const element = document.getElementById(`sensor-chart-${this._id}`)
    if (element) {
      const ctx = element.getContext('2d')
      new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              data: data.map((d) => ({ t: d.t, y: d.v })),
              pointRadius: 1,
              fill: 'origin'
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            yAxes: [{
              display: false,
              beginAtZero: true,
              ticks: {
                suggestedMax: 1 // min amplitude for y
              }
            }],
            xAxes: [{
              type: 'time',
              display: false
            }]
          },
          elements: {
            line: {
              tension: 0
            }
          },
          layout: {
            padding: 5
          },
          animation: {
            duration: 0
          },
          hover: {
            animationDuration: 0
          },
          responsiveAnimationDuration: 0,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            filler: {
              propagate: true
            }
          }
        }
      })
    }
  }

  updateBigChart (data) {
    if (!data || !data.length || data.length <= 2) {
      return
    }
    // http://www.chartjs.org/docs/latest

    const element = document.getElementById(`sensor-big-chart-${this._id}`)
    if (element) {
      const ctx = element.getContext('2d')
      this._bigChart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              data: data.map((d) => ({ t: d.t, y: d.v })),
              pointRadius: 4,
              fill: false,
              borderWidth: 2,
              borderColor: 'red' // TODO !0: dynamic, selon la couleur du theme...
              // TODO !0: legend/label for popins
            },
            {
              data: data.map((d) => ({ t: d.t, y: d.M })),
              pointRadius: 0,
              fill: false,
              borderWidth: 1,
              borderColor: 'yellow' // TODO !0: dynamic, selon la couleur du theme...
              // TODO !0: legend/label for popins
            },
            {
              data: data.map((d) => ({ t: d.t, y: d.m })),
              pointRadius: 0,
              fill: 1,
              borderWidth: 1,
              borderColor: 'pink', // TODO !0: dynamic, selon la couleur du theme...
              backgroundColor: 'blue' // TODO !0: dynamic
              // TODO !0: legend/label for popins
            }
          ]
        },
        options: {
          legend: { display: false },
          scales: {
            yAxes: [{
              display: true,
              ticks: {
                suggestedMax: 1 // min amplitude for y
              }
              // TODO !0: legend, scales, etc...
            }],
            xAxes: [{
              type: 'time',
              display: true
            }]
          },
          elements: {
            line: {
              tension: 0
            }
          },
          layout: {
            padding: 5
          },
          animation: {
            duration: 300
          },
          hover: {
            animationDuration: 300
          },
          responsiveAnimationDuration: 300,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            filler: {
              propagate: true
            }
          }
        }
      })
    }
  }

  refresh () {
    if (this._mounted) {
      this.receiveNewParams(this.state.params)
    }
  }
}

export default SensorMultiLevelItem
