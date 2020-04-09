'use strict'

/* global $ */
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
    this.state.sensorHistory = null

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
        productObjectProxy.sensorMultiLevelGetHistory ? productObjectProxy.sensorMultiLevelGetHistory() : null,
        productObjectProxy.sensorMultiLevelGetLabel ? productObjectProxy.sensorMultiLevelGetLabel() : null,
        productObjectProxy.sensorMultiLevelGetUnits ? productObjectProxy.sensorMultiLevelGetUnits() : null
      ])
      .then(([node, sensorFormattedValue, sensorHistory, label, units]) => {
        console.log('###', productObjectProxy, sensorHistory)
        this.setState({
          params, node, productObjectProxy, sensorFormattedValue, sensorHistory, label, units
        })
        this.updateChart(sensorHistory)
      })
      .catch(console.error)
    })
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
          header={title || 'Sensor history'} fixedFooter={true}
          className='very-large-modal thin-scrollable modal-thin-padding'
          options={{
            dismissible: true,
            inDuration: animationLevel >= 2 ? 300 : 0,
            outDuration: animationLevel >= 2 ? 300 : 0,
            startingTop: '10%',
            endingTop: '4%',
            opacity: 0.5,
            preventScrolling: true,
            onOpenStart: () => {
              this.setState({ modalOpened: true })
            },
            onOpenEnd: () => {
              console.log('######', this.state.sensorHistory, sensorHistory)
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
    console.log('####', this.state.productObjectProxy, this.state.sensorHistory)
    if (!this.state.productObjectProxy || !this.state.sensorHistory ||
      !this.state.sensorHistory.length || this.state.sensorHistory.length <= 2) {
      return
    }
    const modal = $(`#sensor-multi-level-popup-${this._id}`)
    if (this.state.modalOpened) {
      return
    }
    modal.modal('open')
  }

  updateChart (data) {
    if (!data || !data.length || (data.length <= 2)) {
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
    console.log('#########', data)
    if (!data || !data.length || data.length <= 2) {
      return
    }
    // http://www.chartjs.org/docs/latest

    const element = document.getElementById(`sensor-big-chart-${this._id}`)
    if (element) {
      const ctx = element.getContext('2d')
      const drawWhite = $(element).closest('.modal').hasClass('white-text')
      let labelString = this.state.label
      if (this.state.units && labelString) {
        labelString += ` (in ${this.state.units}`
      }

      this._bigChart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              data: data.map((d) => ({ t: d.t, y: d.v })),
              pointRadius: 4,
              fill: false,
              borderWidth: 2,
              borderColor: drawWhite ? '#fff' : '#000',
              label: 'Mean value'
            },
            {
              data: data.map((d) => ({ t: d.t, y: d.M })),
              pointRadius: 0,
              fill: false,
              borderWidth: 1,
              borderColor: drawWhite ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              label: 'Maximum'
            },
            {
              data: data.map((d) => ({ t: d.t, y: d.m })),
              pointRadius: 0,
              fill: 1,
              borderWidth: 1,
              borderColor: drawWhite ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              backgroundColor: drawWhite ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              label: 'Minimum'
            }
          ]
        },

        options: {
          legend: { display: false },
          scales: {
            yAxes: [{
              display: true,
              ticks: {
                fontColor: drawWhite ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                suggestedMax: 1, // min amplitude for y
                padding: 3
              },
              gridLines: {
                color: drawWhite ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                zeroLineWidth: 2
              },
              scaleLabel: {
                display: true,
                labelString: labelString || this.state.params.title,
                fontColor: drawWhite ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
              }
            }],
            xAxes: [{
              type: 'time',
              display: true,
              ticks: {
                fontColor: drawWhite ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                padding: 3
              },
              gridLines: {
                color: drawWhite ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
              }
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
