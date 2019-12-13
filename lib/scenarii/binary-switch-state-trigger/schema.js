'use strict'

import Joi from 'joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave switch state trigger'),
  nodeIds: Joi.array().items(Joi.number().default(0)).optional().default([]),
  event: Joi.string().required().valid('turned-on', 'turned-off', 'inverted').default('inverted')
}

export default schema
