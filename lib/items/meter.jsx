'use strict'

/* global $ */
import Chart from 'chart.js'
import cx from 'classnames'
import React from 'react'
import { Button, Icon, Modal } from 'react-materialize'
import uuid from 'uuid'
import dayjs from 'dayjs'

import { Item } from 'asterism-plugin-library'
import { roundTruncate } from '../tools'

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
        this.setState({
          params, node, productObjectProxy, meterFormattedValue, meterHistory, label, units,
          resetSupported: productObjectProxy.meterResetCounter,
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
              className={resetConfirm ? theme.actions.negative : 'transparent hide-on-small-only'}
              onClick={this.reset.bind(this)}>
              Reset
            </Button>),
            <Button key={0} waves={waves} onClick={this.period.bind(this, 'all')}
              className='modal-footer-switch first' flat={chartPeriod === 'all'}>
              <span className='hide-on-small-only'>4 Years</span>
              <span className='hide-on-med-and-up'>4y</span>
            </Button>,
            <Button key={4} waves={waves} onClick={this.period.bind(this, 'year')}
              className='modal-footer-switch' flat={chartPeriod === 'year'}>
              <span className='hide-on-small-only'>1 Year</span>
              <span className='hide-on-med-and-up'>1y</span>
            </Button>,
            <Button key={8} waves={waves} onClick={this.period.bind(this, 'month')}
              className='modal-footer-switch' flat={chartPeriod === 'month'}>
              <span className='hide-on-small-only'>1 Month</span>
              <span className='hide-on-med-and-up'>1M</span>
            </Button>,
            <Button key={12} waves={waves} onClick={this.period.bind(this, 'week')}
              className='modal-footer-switch' flat={chartPeriod === 'week'}>
              <span className='hide-on-small-only'>2 Weeks</span>
              <span className='hide-on-med-and-up'>2w</span>
            </Button>,
            <Button key={16} waves={waves} onClick={this.period.bind(this, 'day')}
              className='modal-footer-switch' flat={chartPeriod === 'day'}>
              <span className='hide-on-small-only'>2 Days</span>
              <span className='hide-on-med-and-up'>2d</span>
            </Button>,
            <Button key={20} waves={waves} onClick={this.period.bind(this, 'hour')}
              className='modal-footer-switch last' flat={chartPeriod === 'hour'}>
              <span className='hide-on-small-only'>1 Hour</span>
              <span className='hide-on-med-and-up'>1hr</span>
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
    if (!this.state.productObjectProxy || !this.state.meterHistory ||
      !this.state.meterHistory.length || this.state.meterHistory.length <= 2) {
      return
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

    this.state.productObjectProxy.meterResetCounter()
    .then(this.state.productObjectProxy.meterGetAllValues())
    .then((meterHistory) => {
      const modal = $(`#meter-popup-${this._id}`)
      modal.modal('close')
      this.setState({ meterHistory, resetConfirm: false })
    })
  }

  updateChart (data) {
    if (!data || !data.length || (data.length <= 2)) {
      return
    }
    const timeStart = Date.now() - (7 * 24 * 60 * 60 * 1000) // last week
    const timeEnd = dayjs().startOf('day').valueOf()
    data = roundTruncate(data.slice(-128), 'day').filter((e, i) =>
      (e.t >= timeStart || (data[i + 1] && data[i + 1].t >= timeStart)) &&
      ((e.t < timeEnd) || i === data.length - 1))

    // http://www.chartjs.org/docs/latest

    const element = document.getElementById(`meter-chart-${this._id}`)
    if (element) {
      const ctx = element.getContext('2d')
      new Chart(ctx, {
        type: 'bar',
        data: {
          datasets: [
            {
              data: data.map((d, i) => ({
                t: d.t,
                y: i === 0 ? d.v : d.v - data[i - 1].v,
                v: d.v
              })).slice(1).filter(d => (d.y >= 0)),
              borderWidth: 1,
              barThickness: 'flex',
              barPercentage: 1,
              categoryPercentage: 1
            }
          ]
        },
        options: {
          legend: { display: false },
          tooltips: { enabled: false },
          scales: {
            yAxes: [{
              display: false,
              beginAtZero: true,
              ticks: {
                suggestedMax: 0.1 // min amplitude for y
              }
            }],
            xAxes: [{
              type: 'time',
              display: false
            }]
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
          maintainAspectRatio: false
        }
      })
    }
  }

  updateBigChart (data, forceChartPeriod) {
    data = data || []
    if (!data.length || data.length <= 2) {
      return
    }

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
              data: data.map((d, i) => ({
                t: d.t,
                y: i === 0 ? d.v : d.v - data[i - 1].v,
                v: d.v
              })).slice(1).filter(d => (d.y >= 0)),
              borderWidth: 1,
              borderColor: drawWhite ? '#fff' : '#000',
              backgroundColor: drawWhite ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              barThickness: 'flex',
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
                const dataAcc = Number.parseFloat(Number.parseFloat(
                  data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].v
                ).toFixed(4))
                const delta = Number.parseFloat(Number.parseFloat(
                  tooltipItem.yLabel
                ).toFixed(4))
                return `${dataAcc} (+${delta})`
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
