'use strict'

import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Row } from 'react-materialize'

import { CollectionSetting } from 'asterism-plugin-library'

class ZwaveCentralSceneLearner extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      learningMode: false, // true / false / null
      events: [],
      selecteds: []
    }

    this._mounted = false
    this._learningModeAutoShutdown = null
  }

  componentDidMount () {
    this._mounted = true

    this.props.privateSocket.on('node-event-central-scene-triggered', (nodeId, centralSceneValue) => {
      if (!this.state.learningMode || !this._mounted) {
        return
      }
      this.state.events.push({ nodeId, centralSceneValue })
      this.setState({
        events: this.state.events
      })
    })
  }

  componentWillUnmount () {
    this._mounted = false
  }


  render () {
    const { theme, animationLevel, compatibleNodes } = this.props
    const { learningMode, events } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    const list = events.map((ev) => {
      const node = compatibleNodes.find((cn) => cn.nodeid === ev.nodeId)
      // FIXME: equality with .toString() is Bofbof... Maybe a deepequal is better...
      const selected = this.state.selecteds.find((n) => (n.nodeId === ev.nodeId) && (n.centralSceneValue.toString() === ev.centralSceneValue.toString()))
      return {
        title: `${node.name} @ ${node.location}`,
        icon: node.meta.icon,
        onClick: () => {
          if (selected) {
            this.setState({
              selecteds: this.state.selecteds.filter((n) => (n.nodeId !== ev.nodeId) || (n.centralSceneValue.toString() !== ev.centralSceneValue.toString()))
            })
          } else {
            this.state.selecteds.push({ ...ev, node })
            this.setState({
              selecteds: this.state.selecteds
            })
          }
        },
        details: ev.centralSceneValue.toString(),
        secondary: {
          icon: selected ? 'check_box' : 'check_box_outline_blank'
        }
      }
    })

    return (
      <Row>
        {learningMode !== false ? (
          <div className='central-scene-learner'>
            <CollectionSetting theme={theme} animationLevel={animationLevel}
              list={list} header={learningMode ? 'Trigger device\'s button or central scene event you want.' : 'Select the events you want to add'}
              addElement={{
                empty: { title: learningMode ? 'Listening for central scene compatible events... Click to cancel learning' : 'No event found. Click to reset selection', icon: learningMode ? 'stop' : 'check' },
                trailing: { title: learningMode ? 'Stop learning' : 'Validate selection', icon: learningMode ? 'stop' : 'check' },
                onClick: this.bottomButtonClicked.bind(this)
              }}
            />

          </div>
        ) : (
          <Button className={cx(theme.actions.secondary)} onClick={this.setLearningMode.bind(this, true)} waves={waves}>
            <i className="material-icons left">search</i>
            Start learning (for 30 secs.)
          </Button>
        )}
      </Row>
    )
  }

  setLearningMode (mode) {
    this.setState({
      learningMode: mode
    })
    if (this._learningModeAutoShutdown) {
      clearTimeout(this._learningModeAutoShutdown)
      delete this._learningModeAutoShutdown
    }

    if (mode === true) {
      this._learningModeAutoShutdown = setTimeout(() => {
        if (this._mounted && this.state.learningMode === true) {
          this.setLearningMode(null)
        }
      }, 30000)
    }
    if (mode === false) {
      this.setState({
        learningMode: false,
        events: []
      })
    }
    // if null, nothing more.
  }

  bottomButtonClicked () {
    if (this.state.learningMode) {
      this.setLearningMode(null)
    } else {
      this.validateSelection()
    }
  }

  validateSelection () {
    this.props.setSelection(this.state.selecteds);
    this.setLearningMode(false);
  }
}

ZwaveCentralSceneLearner.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  zwaveService: PropTypes.object.isRequired,
  privateSocket: PropTypes.object.isRequired,
  compatibleNodes: PropTypes.array.isRequired,
  setSelection: PropTypes.func.isRequired
}

export default ZwaveCentralSceneLearner
