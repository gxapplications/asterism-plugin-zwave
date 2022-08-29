'use strict'

import Joi from 'joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave power limit trigger'),
  nodeIds: Joi.array().items(Joi.number().default(0)).optional().default([]),
  limit: Joi.number().integer().min(0).max(100).required().default(10),
  way: Joi.string().required().valid('increasing', 'decreasing').default('decreasing')
}

export default schema
