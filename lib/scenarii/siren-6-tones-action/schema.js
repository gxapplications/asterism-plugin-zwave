'use strict'

import Joi from 'joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave meter reset'),
  nodeIds: Joi.array().items(Joi.number().default(0)).optional().default([]),
  volume: Joi.number().integer().min(1).max(3).default(2),
  tone: Joi.number().integer().min(0).max(255).default(255),
  wait: Joi.boolean().default(true)
}

export default schema
