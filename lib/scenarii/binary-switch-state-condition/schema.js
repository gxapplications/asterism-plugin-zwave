'use strict'

import Joi from '@hapi/joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave switch state condition'),
  nodeIds: Joi.array().items(Joi.number().default(0)).optional().default([]),
  aggregation: Joi.string().required().valid('any', 'every').default('any'),
  state: Joi.string().required().valid('on', 'off').default('on')
}

export default schema
