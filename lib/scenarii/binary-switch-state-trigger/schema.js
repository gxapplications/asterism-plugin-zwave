'use strict'

import Joi from 'joi'

const idAndInstance = {
  id: Joi.number().default(0),
  instance: Joi.number().default(1)
}

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave switch state trigger'),
  nodes: Joi.array().items(Joi.object().keys(idAndInstance)).optional().default([]),
  event: Joi.string().required().valid('turned-on', 'turned-off', 'inverted').default('inverted')
}

export default schema
