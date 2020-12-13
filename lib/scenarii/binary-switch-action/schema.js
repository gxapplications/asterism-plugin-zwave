'use strict'

import Joi from '@hapi/joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave switch control'),
  nodeIds: Joi.array().items(Joi.number().default(0)).optional().default([]),
  controlMode: Joi.string().required().valid('invert', 'force-off', 'force-on').default('invert')
}

export default schema
