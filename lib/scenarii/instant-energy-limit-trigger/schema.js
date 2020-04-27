'use strict'

import Joi from '@hapi/joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave power limit trigger'),
  nodeId: Joi.number().required().default(0),
  limit: Joi.number().integer().min(1).max(8000).required().default(1000),
  way: Joi.string().required().valid('increasing', 'decreasing').default('increasing')
}

export default schema
