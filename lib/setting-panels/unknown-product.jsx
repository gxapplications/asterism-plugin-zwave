'use strict'

import PropTypes from 'prop-types'
import React from 'react'

import StandardProductChanger from './standard-product-changer'

class UnknownSettingPanel extends React.Component {
  render () {
    const { nodeId, animationLevel, theme, reconfigureElement, services } = this.props

    return (
      <div className='section card form'>
        Your product is not directly supported by this version of Asterism. You can try a standard support:
        <br />
        <StandardProductChanger nodeId={nodeId} animationLevel={animationLevel} theme={theme}
          zwaveService={services()['asterism-plugin-zwave']} reconfigureElement={reconfigureElement} />
      </div>
    )
  }


}

UnknownSettingPanel.propTypes = {
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

export default UnknownSettingPanel
