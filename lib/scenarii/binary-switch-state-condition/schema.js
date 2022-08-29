'use strict'

import Joi from 'joi'

const idAndInstance = {
  id: Joi.number().default(0),
  instance: Joi.number().default(1)
}

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave switch state condition'),
  nodes: Joi.array().items(Joi.object().keys(idAndInstance)).optional().default([]),
  aggregation: Joi.string().required().valid('any', 'every').default('any'),
  state: Joi.string().required().valid('on', 'off').default('on')
}

export default schema
