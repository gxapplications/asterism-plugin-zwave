'use strict'

import { version, name as packageName } from '../package.json'

const envDir = (process.env.NODE_ENV === 'production') ? 'dist' : 'lib'
const cssExtension = (process.env.NODE_ENV === 'production') ? 'css' : 'scss'

// TODO !8: scenarii scenario extending base scenario, but compatible with zwave scenes...

const manifest = {
  name: packageName,
  libName: packageName,
  version,
  privateSocket: true,
  dependencies: [
    'asterism-scenarii'
  ],
  server: {
    middlewares: (context) => [
      `${packageName}/${envDir}/server-middleware`
    ]
  },
  browser: {
    editPanels: [
      `${packageName}/${envDir}/panel`
    ],
    services: (context) => [
      `${packageName}/${envDir}/browser-service`
    ],
    itemFactory: `${packageName}/${envDir}/items/item-factory`,
    settingsPanel: `${packageName}/${envDir}/settings`,
    styles: `${packageName}/${envDir}/styles.${cssExtension}`
  }
}

export default manifest
