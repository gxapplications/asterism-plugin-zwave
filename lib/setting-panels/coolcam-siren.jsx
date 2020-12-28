'use strict'

/* global wNumb */
import BaseSettingPanel from './base'
import cx from 'classnames'
import { Button, Row } from 'react-materialize'
import NameLocation from './name-location'

class CoolcamSirenSettingPanel extends BaseSettingPanel {
  constructor (props) {
    super(props, CoolcamSirenSettingPanel.configurations)
    this.withBatteryLevelSupport()

    this.state = {
      ...this.state,
      switchState: null
    }
  }

  componentDidMount () {
    this.socket.on('node-event-binary-switch-changed', (nodeId, value) => {
      if (this.props.nodeId !== nodeId) {
        return
      }

      if (this.mounted) {
        if (this.state.switchState !== value.value) {
          this.setState({
            switchState: value.value
          })
        }
      }
    })

    this.props.productObjectProxy.binarySwitchGetState()
    .then((switchState) => super.componentDidMount({ switchState }))
    .catch(console.error)
  }

  plugWidgets () {
    this.plugConfigurationSlider(
      'door-bell-duration-time-slider',
      CoolcamSirenSettingPanel.configurations.DOOR_BELL_SOUND_DURATION_TIME,
      1,
      {
        range: {
          'min': [0, 1],
          '9%': [1, 1],
          '90%': [126, 1],
          'max': [127]
        },
        pips: { // Show a scale with the slider
          mode: 'steps',
          stepped: true,
          density: 4,
          format: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] + 's' })
        },
        tooltips: wNumb({ decimals: 1, edit: (v) => `${v}`.split('.')[0] + 's' })
      },
      this.changeDoorBellDurationTime.bind(this)
    )
  }

  render () {
    const c = CoolcamSirenSettingPanel.configurations

    const { nodeId, animationLevel, theme, productObjectProxy } = this.props
    const { batteryPercent, batteryIcon, switchState, panelReady, configuration } = this.state

    const defaultSirenOnMode = Number.isInteger(configuration[c.DEFAULT_SIREN_ON_MODE])
      ? configuration[c.DEFAULT_SIREN_ON_MODE]
      : ['Alarm music', 'Door bell music'].indexOf(configuration[c.DEFAULT_SIREN_ON_MODE])

    const waves = animationLevel >= 2 ? 'light' : undefined

    return panelReady ? (
      <div>
        <Row>
          <h4 className='col s12 m12 l5'>Siren settings</h4>
          <Button className={cx('col s12 m3 l2 fluid', theme.actions.secondary)} waves={waves}
            onClick={this.binarySwitchStateChange.bind(this)}>Turn {switchState ? 'OFF' : 'ON'}</Button>
          <div className='col s12 m9 l5'>Siren #{nodeId} state actually "{switchState ? 'ON' : 'OFF'}".</div>
          <div className='right'>
            <i className={cx('material-icons', batteryIcon)}>{batteryIcon}</i>&nbsp;{batteryPercent}%
          </div>
          <NameLocation theme={theme} animationLevel={animationLevel} productObjectProxy={productObjectProxy} />
        </Row>

        <h5>Alarm</h5>
        <Row className='section card form'>
          {this.renderListConfigurationAsSelect(
            c.ALARM_SOUND_VOLUME,
            ['Low', 'Middle', 'High'],
            { s: 12, m: 6, label: 'Alarm sound volume' }
          )}
          {this.renderListConfigurationAsSelect(
            c.ALARM_SOUND_DURATION_TIME,
            ['Off', '30 second', '1 minute', '5 minute', 'Always on'],
            { s: 12, m: 6, label: 'Alarm sound duration' }
          )}
          {this.renderListConfigurationAsSelect(
            c.ALARM_SOUND_INDEX,
            ['Doorbell', 'Fur Elise', 'Doorbell Extended', 'Alert', 'William Tell',
              'Rondo Alla Turca', 'Police Siren', 'Evacuation', 'Beep Beep', 'Beep'],
            { s: 12, m: 6, label: 'Alarm sound type' }
          )}
          {this.renderListConfigurationAsSelect(
            c.ALARM_LED_ENABLED,
            ['Disable', 'Enable'],
            { s: 12, m: 6, label: 'Alarm LED' }
          )}
        </Row>

        <h5>Door bell</h5>
        <Row className='section card form'>
          {this.renderListConfigurationAsSelect(
            c.DOOR_BELL_SOUND_VOLUME,
            ['Low', 'Middle', 'High'],
            { s: 12, m: 6, label: 'Door bell sound volume' }
          )}

          <div className='col s12'>
            Door bell duration time
          </div>
          <div className='col s12 slider'>
            <div id={`door-bell-duration-time-slider-${nodeId}`} />
          </div>

          {this.renderListConfigurationAsSelect(
            c.DOOR_BELL_SOUND_INDEX,
            ['Doorbell', 'Fur Elise', 'Doorbell Extended', 'Alert', 'William Tell',
              'Rondo Alla Turca', 'Police Siren', 'Evacuation', 'Beep Beep', 'Beep'],
            { s: 12, m: 6, label: 'Door bell sound type' }
          )}
          {this.renderListConfigurationAsSelect(
            c.DOOR_BELL_LED_ENABLED,
            ['Disable', 'Enable'],
            { s: 12, m: 6, label: 'Door bell LED' }
          )}
        </Row>

        <h5>Advanced</h5>
        <Row className='section card form'>

          TODO !2: {defaultSirenOnMode}

        </Row>
      </div>
    ) : super.render()
  }

  binarySwitchStateChange () {
    this.props.productObjectProxy.binarySwitchInvert().catch(console.error)
  }

  changeDoorBellDurationTime (value) {
    // TODO !1 : door bell duration time, seems different than for alarm ! integer de 0 à 127.
    //  Spec values: 0: jamais, 127 infini. entre, quelle unité de temps ? default=1u
  }
}

CoolcamSirenSettingPanel.propTypes = BaseSettingPanel.propTypes

CoolcamSirenSettingPanel.configurations = {
  ALARM_SOUND_VOLUME: 1,
  ALARM_SOUND_DURATION_TIME: 2,
  DOOR_BELL_SOUND_DURATION_TIME: 3,
  DOOR_BELL_SOUND_VOLUME: 4,
  ALARM_SOUND_INDEX: 5,
  DOOR_BELL_SOUND_INDEX: 6,
  DEFAULT_SIREN_ON_MODE: 7,
  ALARM_LED_ENABLED: 8,
  DOOR_BELL_LED_ENABLED: 9
}

export default CoolcamSirenSettingPanel
