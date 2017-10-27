'use strict'

/* global $ */
import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Input, Row } from 'react-materialize'

class StandardProductChanger extends React.Component {
  constructor (props) {
    super(props)

    this.zwaveService = props.zwaveService

    this.standardProducts = [
      { value: 'standard-binary-switch', name: 'Binary switch' },
      { value: 'unknown', name: 'No support' }
    ]

    this.state = {
      currentValue: 'unknown'
    }

    this.zwaveService.getNodeById(props.nodeId)
    .then((node) => {
      this.setState({
        currentValue: node.overrideProduct || 'unknown'
      })
    })
  }

  render () {
    // const { animationLevel, theme } = this.props
    const { currentValue } = this.state

    return (
      <div>
        <Input s={12} type='select' label='Change product support'
          onChange={this.changeProductSupport.bind(this)} value={currentValue}>
          {this.standardProducts.map(({ value, name }, idx) => (
            <option key={idx} value={value}>{name}</option>
          ))}
        </Input>
      </div>
    )
  }

  changeProductSupport (event) {
    this.zwaveService.changeStandardProductSupport(this.props.nodeId, event.currentTarget.value)
    .then(() => {
      this.setState({
        currentValue: event.currentTarget.value
      })
      this.props.reconfigureElement()
    })
  }

}

StandardProductChanger.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  nodeId: PropTypes.number.isRequired,
  reconfigureElement: PropTypes.func.isRequired,
  zwaveService: PropTypes.object.isRequired
}

export default StandardProductChanger
