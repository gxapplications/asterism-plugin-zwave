'use strict'

/* global $ */
import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, TextInput } from 'react-materialize'
import uuid from 'uuid'

class NameLocation extends React.Component {
  constructor (props) {
    super(props)

    this.zwaveService = props.zwaveService

    this.state = {
      name: null,
      location: null,
      editMode: false
    }

    this._id = uuid.v4()
  }

  componentDidMount () {
    Promise.all([
      this.props.productObjectProxy.getName ? this.props.productObjectProxy.getName() : Promise.resolve('Error'),
      this.props.productObjectProxy.getLocation ? this.props.productObjectProxy.getLocation() : Promise.resolve('Error')
    ])
    .then(([name, location]) => {
      this.setState({ name, location })
    })
  }

  render () {
    const { animationLevel, theme } = this.props
    const { name, location, editMode } = this.state

    const waves = animationLevel >= 2 ? 'light' : undefined

    return (
      <h5 className={cx('name-location col s11', editMode ? 'section card' : null)} id={this._id}>
        {!editMode && (name || location) &&
          <div className='read-only col s12 m10 l10'>
            {[name, location].filter(e => !!e).join(' @ ')}
          </div>
        }

        {editMode && [
          <TextInput key={0} s={12} m={5} l={6} label='Name' value={name} onChange={this.nameChanged.bind(this)} />,
          <TextInput key={1} s={12} m={5} l={5} label='Location' value={location} onChange={this.locationChanged.bind(this)} />
        ]}

        <Button className={cx('right btn-floating btn-large', editMode ? theme.actions.edition : theme.actions.inconspicuous)}
          onClick={this.editMode.bind(this)} waves={waves}>
          <i className='material-icons'>{editMode ? 'check' : 'edit'}</i>
        </Button>
      </h5>
    )
  }

  nameChanged (event) {
    this.setState({
      name: event.currentTarget.value
    })
  }

  locationChanged (event) {
    this.setState({
      location: event.currentTarget.value
    })
  }

  editMode () {
    if (this.state.editMode) {
      if (this.state.name !== null) {
        this.props.productObjectProxy.setName(this.state.name)
      }
      if (this.state.location !== null) {
        this.props.productObjectProxy.setLocation(this.state.location)
      }
      this.setState({
        editMode: false
      })
    } else {
      this.setState({ editMode: true })
    }
  }
}

NameLocation.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  productObjectProxy: PropTypes.object.isRequired
}

export default NameLocation
