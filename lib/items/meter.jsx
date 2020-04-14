'use strict'

/* global $ */
import Chart from 'chart.js'
import cx from 'classnames'
import React from 'react'
import { Button, Icon, Modal } from 'react-materialize'
import uuid from 'uuid'

import { Item } from 'asterism-plugin-library'

class MeterItem extends Item {
  constructor (props) {
    super(props)

    this.state.node = null
    this.state.productObjectProxy = null
    this.state.meterFormattedValue = '...'
    this.state.modalOpened = false
    this.state.meterHistory = null
    this.state.chartPeriod = 'all'

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
          resetSupported: !!productObjectProxy.meterResetCounter
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
    const { meterFormattedValue, meterHistory, chartPeriod, resetSupported } = this.state
    const { title = '', icon = 'insert_chart_outlined', color = 'secondary' } = this.state.params
    const { mainState, theme } = this.props.context
    const { animationLevel } = mainState()

    const waves = (animationLevel >= 2) ? 'light' : null
    return (
      <Button key={this.props.id} waves={waves}
        className={cx(theme.actions[color], 'truncate fluid Meter')} onClick={this.click.bind(this)}>

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
            (resetSupported && <Button key={95} flat waves={waves} onClick={this.reset.bind(this)}>
              Reset
            </Button>),
            <Button key={0} waves={waves} onClick={this.period.bind(this, 'all')}
              className='modal-footer-switch first' flat={chartPeriod === 'all'}>
              All
            </Button>,
            <Button key={4} waves={waves} onClick={this.period.bind(this, 'year')}
              className='modal-footer-switch' flat={chartPeriod === 'year'}>
              Year
            </Button>,
            <Button key={8} waves={waves} onClick={this.period.bind(this, 'month')}
              className='modal-footer-switch' flat={chartPeriod === 'month'}>
              Month
            </Button>,
            <Button key={12} waves={waves} onClick={this.period.bind(this, 'week')}
              className='modal-footer-switch' flat={chartPeriod === 'week'}>
              Week
            </Button>,
            <Button key={16} waves={waves} onClick={this.period.bind(this, '48h')}
              className='modal-footer-switch last' flat={chartPeriod === '48h'}>
              48hrs
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
    // TODO !0
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
      // TODO
    }
  }

  updateBigChart (data, forceChartPeriod) {
    data = data || []
    if (!data.length || data.length <= 2) {
      return
    }

    const timeEnd = Date.now()
    let timeStart = 0
    let forceTicks = undefined
    let dayTickFormat = 'DD'
    switch (forceChartPeriod || this.state.chartPeriod) {
      case 'year':
        timeStart = timeEnd - (366 * 24 * 3600000)
        forceTicks = 'month'
        break
      case 'month':
        timeStart = timeEnd - (31 * 24 * 3600000)
        forceTicks = 'day'
        break
      case 'week':
        timeStart = timeEnd - (7 * 24 * 3600000)
        forceTicks = 'day'
        dayTickFormat = 'ddd'
        break
      case '48h':
        timeStart = timeEnd - (48 * 3600000)
        forceTicks = 'hour'
        break
      case 'all':
      default:
        timeStart = null
        forceTicks = 'day'
        dayTickFormat = 'MMM DD'
    }
    if (timeStart) {
      data = data.filter((e) => e.t >= timeStart)
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

      // TODO
    }
  }

  refresh () {
    if (this._mounted) {
      this.receiveNewParams(this.state.params)
    }
  }
}

export default MeterItem
