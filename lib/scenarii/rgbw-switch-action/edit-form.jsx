'use strict'

/* global $, noUiSlider, wNumb */
import PropTypes from 'prop-types'
import React from 'react'
import { Select, Preloader, Row } from 'react-materialize'
import uuid from 'uuid'

class ZwaveRgbwActionEditForm extends React.Component {
  constructor (props) {
    super(props)
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      compatibleNodes: [],
      ready: false,
      nodeIds: []
    }

    this._mounted = false
    this._id = uuid.v4()
  }

  componentDidMount () {
    this._mounted = true
    this.zwaveService.getNodesByProvidedFunctions(['setRGBWColorsPercent', 'setRGBWBrightnessPercent'])
    .then((nodes) => {
      if (this._mounted) {
        this.setState({
          compatibleNodes: nodes.length ? nodes : [{ nodeid: 0, name: 'No compatible device available' }],
          ready: true
        })
        if (nodes.length === 1) {
          this.props.instance.data.nodeIds[0] = nodes[0].nodeid
          this.nameChange()
          this.setState({
            nodeIds: this.props.instance.data.nodeIds
          })
        }
      }
      this.plugWidgets()
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }

  componentDidUpdate (prevProps, prevState) {
    this.plugWidgets()
  }

  plugWidgets () {
    const { values } = this.props.instance.data

    const domSlider1 = $(`#red-slider-${this._id}`)[0]
    if (domSlider1) {
      if (!this._slider1 || !domSlider1.noUiSlider) {
        this._slider1 = noUiSlider.create(domSlider1, {
          start: values[0] || 0,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 1],
            '50%': [15, 5],
            '80%': [50, 10],
            '96%': [90, 9],
            'max': [99]
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
            format: wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] + '%' }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider1.on('change', this.changeValues.bind(this, 0))
      } else {
        this._slider1.set(values[0] || 0)
      }
    }

    const domSlider2 = $(`#green-slider-${this._id}`)[0]
    if (domSlider2) {
      if (!this._slider2 || !domSlider2.noUiSlider) {
        this._slider2 = noUiSlider.create(domSlider2, {
          start: values[1] || 0,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 1],
            '50%': [15, 5],
            '80%': [50, 10],
            '96%': [90, 9],
            'max': [99]
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
            format: wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] + '%' }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider2.on('change', this.changeValues.bind(this, 1))
      } else {
        this._slider2.set(values[1] || 0)
      }
    }

    const domSlider3 = $(`#blue-slider-${this._id}`)[0]
    if (domSlider3) {
      if (!this._slider3 || !domSlider3.noUiSlider) {
        this._slider3 = noUiSlider.create(domSlider3, {
          start: values[2] || 0,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 1],
            '50%': [15, 5],
            '80%': [50, 10],
            '96%': [90, 9],
            'max': [99]
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
            format: wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] + '%' }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider3.on('change', this.changeValues.bind(this, 2))
      } else {
        this._slider3.set(values[2] || 0)
      }
    }

    const domSlider4 = $(`#white-slider-${this._id}`)[0]
    if (domSlider4) {
      if (!this._slider4 || !domSlider4.noUiSlider) {
        this._slider4 = noUiSlider.create(domSlider4, {
          start: values[3] || 0,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 1],
            '50%': [15, 5],
            '80%': [50, 10],
            '96%': [90, 9],
            'max': [99]
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
            format: wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] + '%' }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider4.on('change', this.changeValues.bind(this, 3))
      } else {
        this._slider4.set(values[3] || 0)
      }
    }

    const domSlider5 = $(`#brightness-slider-${this._id}`)[0]
    if (domSlider5) {
      if (!this._slider5 || !domSlider5.noUiSlider) {
        this._slider5 = noUiSlider.create(domSlider5, {
          start: values[4] || 0,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 1],
            '50%': [15, 5],
            '80%': [50, 10],
            '96%': [90, 9],
            'max': [99]
          },
          format: wNumb({
            decimals: 1,
            edit: (v) => Math.round(v)
          }),
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
            format: wNumb({
              decimals: 1,
              edit: (v) => `${v}`.split('.')[0]
            })
          },
          tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] + '%' }), // decimals: 0 does not work...
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider5.on('change', this.changeValues.bind(this, 4))
      } else {
        this._slider5.set(values[4] || 0)
      }
    }
  }

  render () {
    const { compatibleNodes, ready } = this.state
    const { controlMode, nodeIds } = this.props.instance.data

    return ready ? (
      <Row className='section card form'>
        <br className='col s12 m12 l12' key={uuid.v4()} />
        {compatibleNodes.length > 0 ? nodeIds.map((nodeId, idx) => (
          <Select key={uuid.v4()} s={12} m={6} l={4} label={`Z-wave device #${idx + 1}`} icon='color_lens'
            onChange={this.nodeChanged.bind(this, idx)} value={`${nodeId}`}>
            {compatibleNodes.map((node, i) => (
              <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
            ))}
            <option key={uuid.v4()} value='0'>(Remove it)</option>
          </Select>
        )) : (
          <div>Compatible devices not found on the network.</div>
        )}
        <Select key={uuid.v4()} s={12} m={6} l={4}
          label={`Z-wave device #${nodeIds.length + 1}`} icon='color_lens'
          onChange={this.nodeChanged.bind(this, nodeIds.length)} value=''>
          <option key={uuid.v4()} value='' disabled>(Choose one to add)</option>
          {compatibleNodes.map((node, idx) => (
            <option key={uuid.v4()} value={node.nodeid}>{node.name}</option>
          ))}
        </Select>

        <div className='col s12 m12 l12' key={uuid.v4()}>&nbsp;</div>
        <Select s={12} label='Action' icon='tune' onChange={this.controlModeChanged.bind(this)}
          value={controlMode || 'invert'}>
          <option key='colors' value='colors'>Set colors RGBW</option>
          <option key='brightness' value='brightness'>Change only brightness</option>
          <option key='off' value='off'>Turn OFF</option>
        </Select>

        {controlMode === 'colors' && (
          <div>
            <div className='col s12'>Red</div>
            <div className='col s12 slider'>
              <div id={`red-slider-${this._id}`} />
            </div>
            <div className='col s12'>Green</div>
            <div className='col s12 slider'>
              <div id={`green-slider-${this._id}`} />
            </div>
            <div className='col s12'>Blue</div>
            <div className='col s12 slider'>
              <div id={`blue-slider-${this._id}`} />
            </div>
            <div className='col s12'>White</div>
            <div className='col s12 slider'>
              <div id={`white-slider-${this._id}`} />
            </div>
          </div>
        )}

        {controlMode === 'brightness' && (
          <div>
            <div className='col s12'>Brightness</div>
            <div className='col s12 slider'>
              <div id={`brightness-slider-${this._id}`} />
            </div>
          </div>
        )}
      </Row>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }

  nodeChanged (index, event) {
    const newNodeId = parseInt(event.currentTarget.value)
    if (newNodeId > 0) {
      this.props.instance.data.nodeIds[index] = newNodeId
    } else {
      const nodeIds = this.props.instance.data.nodeIds.filter((nodeId, idx) => idx !== index)
      if (nodeIds.length > 0) { // avoid to remove all nodes (1 min needed)
        this.props.instance.data.nodeIds = nodeIds
      }
    }
    this.setState({
      nodeIds: this.props.instance.data.nodeIds
    })
    this.nameChange()
  }

  controlModeChanged (event) {
    this.props.instance.data.controlMode = event.currentTarget.value
    this.setState({
      controlMode: this.props.instance.data.controlMode
    })
    this.nameChange()
  }

  changeValues(index, value) {
    const values = this.props.instance.data.values
    values[index] = value[0]
    this.props.instance.data.values = values
    this.setState({ values })
  }

  nameChange () {
    if (this.props.instance.data.nodeIds.length === 0) {
      this.props.instance.data.name = 'Misconfigured RGBW control'
      return
    }
    const nodeNames = this.state.compatibleNodes
      .filter((node) => this.props.instance.data.nodeIds.includes(node.nodeid))
      .map((node) => `"${node.name}"`)
    this.props.instance.data.name = nodeNames.length > 1 ? `[${nodeNames.join(',')}]` : nodeNames[0]
    this.props.highlightCloseButton()
  }
}

ZwaveRgbwActionEditForm.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  instance: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  highlightCloseButton: PropTypes.func
}

ZwaveRgbwActionEditForm.defaultProps = {
  highlightCloseButton: () => {}
}

ZwaveRgbwActionEditForm.label = 'Z-wave RGBW switch control'

export default ZwaveRgbwActionEditForm
