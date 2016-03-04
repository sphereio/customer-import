import { expect } from 'chai'
import CustomerImport from '../src'
import { SphereClient } from 'sphere-node-sdk'

const PROJECT_KEY = 'sphere-node-customer-import'

describe('customer import module', () => {

  const options = {
    config: {
      project_key: PROJECT_KEY,
      client_id: '*********',
      client_secret: '*********'
    },
    rest: {
      config: {},
      // GET: (/* endpoint, callback */) => {},
      // POST: () => (/* endpoint, payload, callback */) => {},
      // PUT: () => {},
      // DELETE: () => (/* endpoint, callback */) => {},
      // PAGED: () => (/* endpoint, callback */) => {},
      // _preRequest: () => {},
      // _doRequest: () => {}
    }
  }
  const logger = {
    trace: console.log,
    debug: console.log,
    info: console.log,
    error: console.error
  }

  it('should be class', () => {
    const expected = 'function'
    const actual = typeof CustomerImport

    expect(actual).to.equal(expected)
  })

  it('should create a sphere client', () => {
    const importer = new CustomerImport(logger, options)
    const expected = SphereClient
    const actual = importer.client.constructor

    expect(actual).to.equal(expected)
  })

  it(`summaryReport should return no errors and no imported customers
    if no customers were imported`, () => {
    const importer = new CustomerImport(logger, options)
    const expected = { errors: [], successfullImports: 0 }
    const actual = importer.summaryReport()

    expect(actual).to.deep.equal(expected)
  })

  it('performStream function should exist', () => {
    const importer = new CustomerImport(logger, options)
    const expected = 'function'
    const actual = typeof importer.performStream

    expect(actual).to.equal(expected)
  })

  it('performStream function should call it\'s callback', (done) => {
    const callback = () => {
      done()
    }
    const importer = new CustomerImport(logger, options)

    importer.performStream(null, callback)
  })

  describe('validation method', () => {

    it('should resolve if the customer object is valid', (done) => {
      const importer = new CustomerImport(logger, options)
      importer.validateCustomer({ email: 'test@test.de' })
      .then(() => {
        done()
      })
    })

    it('should reject if the customer object is invalid', (done) => {
      const importer = new CustomerImport(logger, options)
      importer.validateCustomer({})
      .catch(() => {
        done()
      })
    })

  })

  describe('importCustomer method', () => {

    it('should increase the successfullImports counter', (done) => {
      const importer = new CustomerImport(logger, options)
      importer.importCustomer({ email: 'test@test.de' })
      .then(() => {
        const actual = importer.summary.successfullImports
        const expected = 1
        expect(actual).to.equal(expected)
        done()
      })
    })

    it(`should push the error and the corresponding customer
    to the errors array`, (done) => {
      const importer = new CustomerImport(logger, options)
      importer.importCustomer({})
      .then(() => {
        const actual = importer.summary.errors.length
        const expected = 1
        expect(actual).to.equal(expected)
        done()
      })
    })

  })

})
