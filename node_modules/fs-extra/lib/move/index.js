'use strict'

const u = require('universalify').fromCallback
module.exports = {
  move: u(require('./move')),
  moveSync: require('./move-sync')
}
