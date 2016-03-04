import { SphereClient } from 'sphere-node-sdk'

export default class CustomerImport {

  constructor (logger, config = {}) {
    this.logger = logger
    this.client = new SphereClient(config)
  }

  summaryReport () {
    return {}
  }

  performStream (batch, next) {
    // process batch
    // call next for next batch
    next()
  }
}
