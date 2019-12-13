'use strict'

import Joi from 'joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave RGBW control'),
  nodeIds: Joi.array().items(Joi.number().default(0)).optional().default([]),
  controlMode: Joi.string().required().valid('colors', 'brightness', 'off').default('colors'),
  values: Joi.array().items(Joi.number().required().default(0).min(0).max(100)).min(5).max(5).default([0, 0, 0, 0, 0])
}

export default schema
