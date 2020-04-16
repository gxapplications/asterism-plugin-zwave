'use strict'

/* global $ */
import Chart from 'chart.js'
import cx from 'classnames'
import React from 'react'
import { Button, Icon, Modal } from 'react-materialize'
import uuid from 'uuid'
import dayjs from 'dayjs'

import { Item } from 'asterism-plugin-library'
import { roundTruncate, compileTruncate } from '../tools'

class MeterItem extends Item {
  constructor (props) {
    super(props)

    this.state.node = null
    this.state.productObjectProxy = null
    this.state.meterFormattedValue = '...'
    this.state.modalOpened = false
    this.state.meterHistory = null
    this.state.chartPeriod = 'week'
    this.state.resetConfirm = false

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
        productObjectProxy.meterGetFormatted ? productObjectProxy.meterGetFormatted() : null,
        productObjectProxy.meterGetAllValues ? productObjectProxy.meterGetAllValues() : null,
        productObjectProxy.meterGetLabel ? productObjectProxy.meterGetLabel() : null,
        productObjectProxy.meterGetUnits ? productObjectProxy.meterGetUnits() : null
      ])
      .then(([node, meterFormattedValue, meterHistory, label, units]) => {
console.log('#### 0', meterFormattedValue, meterHistory, label, units)
        this.setState({
          params, node, productObjectProxy, meterFormattedValue, meterHistory, label, units,
          resetSupported: !productObjectProxy.meterResetCounter,
          resetConfirm: false
        })
        this.updateChart(meterHistory)
      })
      .catch(console.error)
    })
  }

  componentDidMount () {
    this._mounted = true

    $(`#meter-popup-${this._id}`)
      .addClass(this.props.context.theme.actions[this.state.params.color || 'secondary'])

    this._socket.on('node-event-meter-changed', (nodeId, value) => {
      if (this.state.params.nodeId != nodeId) { // eslint-disable-line eqeqeq
        return
      }

      this.state.productObjectProxy.meterGetFormatted()
      .then((meterFormattedValue) => {
        if (this._mounted) {
          this.setState({
            meterFormattedValue
          })

          if (this.state.productObjectProxy.meterGetAllValues) {
            this.state.productObjectProxy.meterGetAllValues()
            .then((meterHistory) => {
              this.setState({ meterHistory })
              this.updateChart(meterHistory)
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
    const { meterFormattedValue, meterHistory, chartPeriod, resetSupported, resetConfirm } = this.state
    const { title = '', icon = 'insert_chart_outlined', color = 'secondary' } = this.state.params
    const { mainState, theme } = this.props.context
    const { animationLevel } = mainState()

    const waves = (animationLevel >= 2) ? 'light' : null
    const wavesDelete = (animationLevel >= 2) ? 'red' : null
    return (
      <Button key={this.props.id} waves={waves} onClick={this.click.bind(this)}
        className={cx(theme.actions[color], 'truncate fluid Meter')}>

        {meterHistory !== null && (
          <div className='meterGraph'>
            <canvas id={`meter-chart-${this._id}`} className='chart' />
          </div>
        )}

        <Icon left>{icon}</Icon>
        <span className='twoLinesButtonTitle'>
          <span>{title}</span>
          <span>{meterFormattedValue}</span>
        </span>

        <Modal id={`meter-popup-${this._id}`}
          header={title || 'Meter history'} fixedFooter={true}
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
              this.updateBigChart(this.state.meterHistory)
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
          actions={[
            (resetSupported && <Button small key={95} flat={!resetConfirm}
              waves={resetConfirm ? waves : wavesDelete}
              className={resetConfirm ? theme.actions.negative : 'transparent'}
              onClick={this.reset.bind(this)}>
              Reset
            </Button>),
            <Button key={0} waves={waves} onClick={this.period.bind(this, 'all')}
              className='modal-footer-switch first' flat={chartPeriod === 'all'}>
              4 years
            </Button>,
            <Button key={4} waves={waves} onClick={this.period.bind(this, 'year')}
              className='modal-footer-switch first' flat={chartPeriod === 'year'}>
              Year
            </Button>,
            <Button key={8} waves={waves} onClick={this.period.bind(this, 'month')}
              className='modal-footer-switch' flat={chartPeriod === 'month'}>
              Month
            </Button>,
            <Button key={12} waves={waves} onClick={this.period.bind(this, 'week')}
              className='modal-footer-switch' flat={chartPeriod === 'week'}>
              2 Weeks
            </Button>,
            <Button key={16} waves={waves} onClick={this.period.bind(this, 'day')}
              className='modal-footer-switch' flat={chartPeriod === 'day'}>
              2 Days
            </Button>,
            <Button key={20} waves={waves} onClick={this.period.bind(this, 'hour')}
              className='modal-footer-switch last' flat={chartPeriod === 'hour'}>
              Hour
            </Button>,
            <Button key={99} flat modal='close' waves={waves}>
              Close
            </Button>
          ]}
        >
          <div className='MeterGraph'>
            <canvas id={`meter-big-chart-${this._id}`} className='chart' />
          </div>
        </Modal>
      </Button>
    )
  }

  click () {
    if (!this.state.productObjectProxy || !this.state.sensorHistory ||
      !this.state.meterHistory.length || this.state.meterHistory.length <= 2) {
      //return // TODO !0: uncomment it
    }
    const modal = $(`#meter-popup-${this._id}`)
    if (this.state.modalOpened) {
      return
    }
    modal.modal('open')
  }

  period (chartPeriod) {
    this.setState({ chartPeriod })
    if (this._bigChart) {
      this._bigChart.destroy()
    }
    this.updateBigChart(this.state.meterHistory, chartPeriod)
  }

  reset () {
    if (!this.state.resetConfirm) {
      this.setState({ resetConfirm: true })
      clearTimeout(this._resetTimer)
      this._resetTimer = setTimeout(() => {
        if (this._mounted) {
          this.setState({ resetConfirm: false })
        }
      }, 3000)
      return
    }

    // TODO !0: do it ! call reset, THEN, force an item refresh ! or just a call to meterGetAllValues ?
    this.setState({ resetConfirm: false })
  }

  updateChart (data) {
    if (!data || !data.length || (data.length <= 2)) {
      return
    }
    const timeStart = Date.now() - (24 * 60 * 60 * 1000) // 24 last hours
    data = data.slice(-128).filter((e) => e.t >= timeStart)

    // http://www.chartjs.org/docs/latest

    const element = document.getElementById(`meter-chart-${this._id}`)
    if (element) {
      const ctx = element.getContext('2d')
      // TODO !0
    }
  }

  updateBigChart (data, forceChartPeriod) {
    const now = Date.now()
    data = data || compileTruncate([ // TODO !0: empty array
      { t: now - (13 * 31 * 24 * 3600 * 1000), v: 42, i: 1 },
      { t: now - (8 * 31 * 24 * 3600 * 1000), v: 44, i: 1 },
      { t: now - (7 * 31 * 24 * 3600 * 1000), v: 45, i: 1 },
      { t: now - (6 * 31 * 24 * 3600 * 1000), v: 46, i: 1 },
      { t: now - (5 * 31 * 24 * 3600 * 1000), v: 48, i: 1 },
      { t: now - (4 * 31 * 24 * 3600 * 1000), v: 50, i: 1 },

      { t: now - (3 * 31 * 24 * 3600 * 1000) - (7 * 3600 * 1000), v: 51, i: 1 },
      { t: now - (3 * 31 * 24 * 3600 * 1000) - (3 * 3600 * 1000), v: 52, i: 1 },
      { t: now - (3 * 31 * 24 * 3600 * 1000) - (1 * 3600 * 1000), v: 55, i: 1 },
      { t: now - (3 * 31 * 24 * 3600 * 1000), v: 68, i: 1 },

      { t: now - (13 * 24 * 3600 * 1000), v: 76, i: 1 },
      { t: now - (12 * 24 * 3600 * 1000), v: 78, i: 1 },
      { t: now - (9 * 24 * 3600 * 1000), v: 80, i: 1 },
      { t: now - (8 * 24 * 3600 * 1000), v: 81, i: 1 },
      { t: now - (6 * 24 * 3600 * 1000), v: 82, i: 1 },
      { t: now - (5 * 24 * 3600 * 1000), v: 83, i: 1 },
      { t: now - (4 * 24 * 3600 * 1000), v: 84, i: 1 },

      { t: now - (3 * 24 * 3600 * 1000) - (7 * 3600 * 1000), v: 85, i: 1 },
      { t: now - (3 * 24 * 3600 * 1000) - (3 * 3600 * 1000), v: 86, i: 1 },
      { t: now - (3 * 24 * 3600 * 1000) - (1 * 3600 * 1000), v: 87, i: 1 },
      { t: now - (3 * 24 * 3600 * 1000), v: 88, i: 1 },

      { t: now - (16 * 3600 * 1000), v: 89, i: 1 },
      { t: now - (15 * 3600 * 1000), v: 91, i: 1 },
      { t: now - (14 * 3600 * 1000), v: 93, i: 1 },
      { t: now - (12 * 3600 * 1000), v: 94, i: 1 },
      { t: now - (9 * 3600 * 1000), v: 95, i: 1 },
      { t: now - (8 * 3600 * 1000), v: 96, i: 1 },
      { t: now - (6 * 3600 * 1000), v: 97, i: 1 },
      { t: now - (5 * 3600 * 1000), v: 98, i: 1 },

      { t: now - (4 * 3600 * 1000) - (45 * 60 * 1000), v: 100, i: 1 },
      { t: now - (4 * 3600 * 1000) - (35 * 60 * 1000), v: 101, i: 1 },
      { t: now - (4 * 3600 * 1000) - (25 * 60 * 1000), v: 103, i: 1 },
      { t: now - (4 * 3600 * 1000) - (5 * 60 * 1000), v: 105, i: 1 },
      { t: now - (4 * 3600 * 1000) - (4 * 60 * 1000), v: 108, i: 1 },
      { t: now - (4 * 3600 * 1000) - (3 * 60 * 1000), v: 110, i: 1 },
      { t: now - (4 * 3600 * 1000) - (1 * 60 * 1000), v: 110, i: 1 },
      { t: now - (4 * 3600 * 1000), v: 112, i: 1 },

      { t: now - (55 * 60 * 1000), v: 132, i: 1 },
      { t: now - (20 * 60 * 1000), v: 140, i: 1 },
      { t: now - (5 * 60 * 1000), v: 144, i: 1 },
      { t: now - (4 * 60 * 1000), v: 144, i: 1 },
      { t: now - (3 * 60 * 1000), v: 145, i: 1 },
      { t: now - (2 * 60 * 1000), v: 146, i: 1 },

      { t: now - (48 * 1000), v: 147, i: 1 },
      { t: now - (34 * 1000), v: 148, i: 1 },
      { t: now - (20 * 1000), v: 149, i: 1 },
      { t: now - (10 * 1000), v: 150, i: 1 },
      { t: now - (5 * 1000), v: 152, i: 1 },
      { t: now, v: 157, i: 1 }
    ])
    if (!data.length || data.length <= 2) {
      //return // TODO !0: uncomment
    }

console.log('#### 1', data)
    let timeEnd = Date.now()
    const nowDayJs = dayjs()
    let timeStart = 0
    let forceTicks = undefined
    let roundPeriod = 'week'
    let dayTickFormat = 'DD'
    switch (forceChartPeriod || this.state.chartPeriod) {
      case 'year':
        timeStart = timeEnd - (53 * 7 * 24 * 3600000)
        timeEnd = nowDayJs.startOf('week').valueOf()
        forceTicks = 'month'
        break
      case 'month':
        timeStart = timeEnd - (4 * 7 * 24 * 3600000)
        timeEnd = nowDayJs.startOf('week').valueOf()
        forceTicks = 'day'
        break
      case 'week':
        timeStart = timeEnd - (14 * 24 * 3600000)
        timeEnd = nowDayJs.startOf('day').valueOf()
        forceTicks = 'day'
        roundPeriod = 'day'
        dayTickFormat = 'ddd'
        break
      case 'day':
        timeStart = timeEnd - (48 * 3600000)
        timeEnd = nowDayJs.startOf('hour').valueOf()
        forceTicks = 'hour'
        roundPeriod = 'hour'
        break
      case 'hour':
        timeStart = timeEnd - (2 * 3600000)
        forceTicks = 'minute'
        roundPeriod = 'minute'
        break
      case 'all':
      default:
        timeStart = timeEnd - (209 * 7 * 24 * 3600000) // 4 years approx.
        timeEnd = nowDayJs.startOf('week').valueOf()
        forceTicks = 'month'
        break
    }
    if (timeStart) {
      // filter by bounds, but adding 1 element before the first, to let subtract work.
      data = roundTruncate(data, forceTicks).filter((e, i) =>
        (e.t >= timeStart || (data[i + 1] && data[i + 1].t >= timeStart)) &&
        ((e.t < timeEnd) || i === data.length - 1))
    }

    // http://www.chartjs.org/docs/latest
console.log('#### 2', data)

    const element = document.getElementById(`meter-big-chart-${this._id}`)
    if (element) {
      const ctx = element.getContext('2d')
      const drawWhite = $(element).closest('.modal').hasClass('white-text')
      let labelString = this.state.label
      if (this.state.units && labelString) {
        labelString += ` (in ${this.state.units})`
      }

      this._bigChart = new Chart(ctx, {
        type: 'bar',
        data: {
          datasets: [
            {
              data: data.map((d, i) => ({ t: d.t, y: i === 0 ? d.v : d.v - data[i - 1].v, a: d.v })).slice(1),
              borderWidth: 1,
              borderColor: drawWhite ? '#fff' : '#000',
              backgroundColor: drawWhite ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              //barThickness: 'flex',
              barPercentage: 1,
              categoryPercentage: 1
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
                padding: 3,
                min: timeStart,
                max: timeEnd
              },
              gridLines: {
                color: drawWhite ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
              },
              bounds: 'ticks',
              time: {
                isoWeekday: true,
                minUnit: 'minute',
                unit: forceTicks,
                displayFormats: {
                  day: dayTickFormat,
                  month: 'MMM'
                }
              }
            }]
          },
          tooltips: {
            callbacks: {
              label: function (tooltipItem, data) {
                const dataAcc = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].a
                return `${dataAcc} (+${tooltipItem.yLabel})`
              }
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
          maintainAspectRatio: false
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

export default MeterItem
