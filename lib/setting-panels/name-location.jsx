'use strict'

/* global $ */
import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Input } from 'react-materialize'
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
      <h5 className={cx('col s11 section', editMode ? 'card' : null)} id={this._id}>
        {!editMode && (name || location) &&
          <div className='col s12 m10 l10'>
            {[name, location].filter(e => !!e).join(' @ ')}
          </div>
        }

        {editMode && [
          <Input key={0} s={12} m={5} l={6} label='Name' defaultValue={name} ref={(c) => { this._nameInput = c }} />,
          <Input key={1} s={12} m={5} l={5} label='Location' defaultValue={location} ref={(c) => { this._locationInput = c }} />
        ]}

        <Button className={cx('right btn-floating btn-large', editMode ? theme.actions.edition : theme.actions.inconspicuous)}
          onClick={this.editMode.bind(this)} waves={waves}>
          <i className='material-icons'>{editMode ? 'check' : 'edit'}</i>
        </Button>
      </h5>
    )
  }

  editMode () {
    if (this.state.editMode) {
      const name = this._nameInput && this._nameInput.state.value || null
      const location = this._locationInput && this._locationInput.state.value || null
      if (name !== null) {
        this.props.productObjectProxy.setName(name)
      }
      if (location !== null) {
        this.props.productObjectProxy.setLocation(location)
      }
      this.setState({
        name: name !== null ? name : this.state.name,
        location: location !== null ? location : this.state.location,
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
