'use strict'

/* global $, noUiSlider */
import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Preloader, Row, Button, Icon } from 'react-materialize'
import NameLocation from './name-location'

class QubinoZmnhjd1SettingPanel extends React.Component {
  constructor (props) {
    super(props)

    // this._socket = props.privateSocket
    this.zwaveService = props.services()['asterism-plugin-zwave']

    this.state = {
      panelReady: false,
      levelPercent: 20,
      configuration: {}
    }

    this._mounted = false
  }

  componentDidMount () {
    // const configs = QubinoZmnhjd1SettingPanel.configurations
    this._mounted = true
    const o = this.props.productObjectProxy
    Promise.all([
      o.multiLevelSwitchGetPercent()
      //o.getConfiguration(configs.TEMPERATURE_ALARM_THRESHOLD_LOW),
    ])
    .then(([levelPercent]) => {
      this.setState({
        panelReady: true,
        levelPercent,
        configuration: {}
      })

      this.plugWidgets()
    })
    .catch(console.error)
  }

  componentWillUnmount () {
    this._mounted = false
  }

  plugWidgets () {
    const domSlider = $(`#temp-slider-${this.props.nodeId}`)[0]
    if (domSlider) {
      if (!this._slider || !domSlider.noUiSlider) {
        this._slider = noUiSlider.create(domSlider, {
          start: this.state.levelPercent || 20,
          connect: true,
          step: 1,
          animate: true,
          range: {
            'min': [0, 5],
            'max': [100]
          },
          pips: { // Show a scale with the slider
            mode: 'steps',
            density: 3,
          },
          behaviour: 'tap-drag',
          orientation: 'horizontal'
        })

        this._slider.on('change', this.changeMultiLevelValue.bind(this))
      } else {
        this._slider.set(this.state.levelPercent || 20)
      }
    }
  }

  render () {
    const { nodeId, animationLevel, theme, reconfigureElement, productObjectProxy } = this.props
    const { panelReady, levelPercent } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m7 l7'>Pilot Wire settings</h4>
          <div className='col s12 m3 l3'>Currently {levelPercent}.</div>

          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <div className='section card form brightnesses'>
          <div className='col s12'>State</div>
          <Button className={cx('col s12 m3', levelPercent !== 100 ? 'grey' : null)} waves={waves} onClick={this.changeMultiLevelValue.bind(this, 100)} flat={levelPercent === 100}>
            Comfort<Icon left>brightness_high</Icon>
          </Button>
          <Button className={cx('col s12 m3', levelPercent !== 45 ? 'grey' : null)} waves={waves} onClick={this.changeMultiLevelValue.bind(this, 45)} flat={levelPercent === 45}>
            Comfort -1°C<Icon left>brightness_medium</Icon>
          </Button>
          <Button className={cx('col s12 m3', levelPercent !== 35 ? 'grey' : null)} waves={waves} onClick={this.changeMultiLevelValue.bind(this, 35)} flat={levelPercent === 35}>
            Comfort -2°C<Icon left>brightness_low</Icon>
          </Button>
          <Button className={cx('col s12 m3', levelPercent !== 25 ? 'grey' : null)} waves={waves} onClick={this.changeMultiLevelValue.bind(this, 25)} flat={levelPercent === 25}>
            Economic<Icon left>brightness_3</Icon>
          </Button>
          <Button className={cx('col s12 m3', levelPercent !== 15 ? 'grey' : null)} waves={waves} onClick={this.changeMultiLevelValue.bind(this, 15)} flat={levelPercent === 15}>
            Frost free<Icon left>ac_unit</Icon>
          </Button>
          <Button className={cx('col s12 m3', levelPercent !== 0 ? 'grey' : null)} waves={waves} onClick={this.changeMultiLevelValue.bind(this, 0)} flat={levelPercent === 0}>
            Off<Icon left>power_settings_new</Icon>
          </Button>
          <div className='col s12 slider'>
            <div id={`temp-slider-${nodeId}`} />
          </div>
        </div>
      </div>
    ) : (
      <div className='valign-wrapper centered-loader'>
        <Preloader size='big' />
      </div>
    )
  }

  changeMultiLevelValue(value) {
    this.props.productObjectProxy.multiLevelSwitchSetPercent(value, 1)
    this.setState({
      levelPercent: value
    })
  }
}

QubinoZmnhjd1SettingPanel.propTypes = {
  serverStorage: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  localStorage: PropTypes.object.isRequired,
  services: PropTypes.func.isRequired,
  privateSocket: PropTypes.object.isRequired,
  productObjectProxy: PropTypes.object.isRequired,
  nodeId: PropTypes.number.isRequired,
  reconfigureElement: PropTypes.func.isRequired
}

QubinoZmnhjd1SettingPanel.configurations = {
  /*NORMAL_STATE: 1,
  LED_BEHAVIOR: 2,*/
}

export default QubinoZmnhjd1SettingPanel
