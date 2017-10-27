'use strict'

import Joi from 'joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave switch control'),
  nodeId: Joi.number().required().default(0),
  controlMode: Joi.string().required().default('invert') // TODO !0: wait for bug fix: .valid('invert', 'force-off', 'force-on')
}

export default schema
