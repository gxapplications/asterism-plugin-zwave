'use strict'

/* global $ */
import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Select, Row } from 'react-materialize'

class StandardProductChanger extends React.Component {
  constructor (props) {
    super(props)

    this.zwaveService = props.zwaveService

    this.standardProducts = [
      { value: 'standard-binary-switch', name: 'Binary switch' },
      { value: '0260-8002-1000', name: 'Heiman HS1SA-Z (advanced force, cannot revert)' },
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
        <Select s={12} label='Change product support'
          onChange={this.changeProductSupport.bind(this)} value={currentValue}>
          {this.standardProducts.map(({ value, name }, idx) => (
            <option key={idx} value={value}>{name}</option>
          ))}
        </Select>
      </div>
    )
  }

  changeProductSupport (event) {
    const productSupport = event.currentTarget.value
    this.zwaveService.changeStandardProductSupport(this.props.nodeId, productSupport)
      .then(() => {
        this.setState({
          currentValue: productSupport
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
