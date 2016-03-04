import test from 'tape'
import CustomerImport from '../src'
import { SphereClient } from 'sphere-node-sdk'

const PROJECT_KEY = 'sphere-node-customer-import'

test('customer import module', t => {

  const options = {
    config: {
      project_key: PROJECT_KEY,
      client_id: '*********',
      client_secret: '*********'
    },
    rest: {
      config: {},
      GET: (/* endpoint, callback */) => {},
      POST: () => (/* endpoint, payload, callback */) => {},
      PUT: () => {},
      DELETE: () => (/* endpoint, callback */) => {},
      PAGED: () => (/* endpoint, callback */) => {},
      _preRequest: () => {},
      _doRequest: () => {}
    }
  }
  const logger = {
    trace: console.log,
    debug: console.log,
    info: console.log,
    error: console.error
  }

  t.test('should be class', t => {
    const expected = 'function'
    const actual = typeof CustomerImport

    t.equal(expected, actual, 'customerImport should be a function')

    t.end()
  })

  t.test('should create a sphere client', t => {
    const importer = new CustomerImport(logger, options)
    const expected = SphereClient
    const actual = importer.client.constructor

    t.equal(expected, actual, 'customerImport should have a sphere client')

    t.end()
  })

  t.test('should provide a summary report method', t => {
    const importer = new CustomerImport(logger, options)
    const expected = 'function'
    const actual = typeof importer.summaryReport

    t.equal(expected, actual,
      'customerImport should have a summary report method')

    t.end()
  })

  t.test('should provide a performStream method', t => {
    const importer = new CustomerImport(logger, options)
    const expected = 'function'
    const actual = typeof importer.performStream

    t.equal(expected, actual,
      'customerImport should have a performStream method')

    t.end()
  })

})
