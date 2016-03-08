import { expect } from 'chai'
import CustomerImport from '../../src'
import { SphereClient } from 'sphere-node-sdk'
import sinon from 'sinon'
import cuid from 'cuid'
import _ from 'lodash'

const PROJECT_KEY = 'sphere-node-customer-import'

describe('customer import module', () => {

  const options = {
    sphereClientConfig: {
      config: {
        project_key: PROJECT_KEY,
        client_id: '*********',
        client_secret: '*********'
      },
      rest: {
        config: {},
        GET: (endpoint, callback) => {
          callback(null, { statusCode: 200 }, { results: [] })
        },
        POST: (endpoint, payload, callback) => {
          callback(null, { statusCode: 200 })
        },
        PUT: () => {},
        DELETE: () => (/* endpoint, callback */) => {},
        PAGED: () => (/* endpoint, callback */) => {},
        _preRequest: () => {},
        _doRequest: () => {}
      }
    },
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
    const expected = { errors: [], inserted: [], successfullImports: 0 }
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
    const callback = sinon.spy()
    const importer = new CustomerImport(logger, options)

    importer.performStream([], callback)
    .then(() => {
      expect(callback.calledOnce).to.equal(true)
      done()
    })
  })

  it(`performStream function should call importCustomer
  for each customer in the given chunk`, (done) => {
    const mockImportCustomer = sinon.spy(() => {})
    const callback = () => {}
    const customers = Array.from(new Array(10), () => ({ name: cuid() }))
    const importer = new CustomerImport(logger, options)
    sinon.stub(importer, 'importCustomer', mockImportCustomer)

    importer.performStream(customers, callback)
    .then(() => {
      const actual = mockImportCustomer.callCount
      const expected = customers.length
      expect(expected).to.equal(actual)
      done()
    })
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

    let importer

    beforeEach(() => {
      importer = new CustomerImport(logger, options)
      const mockCustomerId = (customerGroup) => {
        return customerGroup ? Promise.resolve(cuid()) : Promise.resolve()
      }
      sinon.stub(importer, 'getCustomerGroupId', mockCustomerId)
    })

    afterEach(() => {
      importer.getCustomerGroupId.restore()
    })

    it('should increase the successfullImports counter', function (done) {
      importer.importCustomer({ email: 'test@test.de', customerGroup: 'test' })
      .then(() => {
        const actual = importer.summary.successfullImports
        const expected = 1
        expect(actual).to.equal(expected)
        done()
      })
      .catch(done)
    })

    it(`should push the error and the corresponding customer
    to the errors array`, (done) => {
      importer.importCustomer({})
      .then(() => {
        const actual = importer.summary.errors.length
        const expected = 1
        expect(actual).to.equal(expected)
        done()
      })
    })

    it('should handle existing customers', (done) => {
      const mockCustomerSave = () => {
        return Promise.reject({
          body: {
            errors: [{
              code: 'DuplicateField'
            }]
          }
        })
      }
      sinon.stub(importer.client.customers, 'save', mockCustomerSave)
      const customer = { email: 'test@test.de' }
      importer.importCustomer(customer)
      .then(() => {
        const actual = importer.summary.errors[0]
        const expected = {
          customer,
          error: 'updating customers is not implement yet'
        }
        expect(actual).to.deep.equal(expected)
        importer.client.customers.save.restore()
        done()
      })
    })

    it('should handle errors during creating a customer', (done) => {
      const mockCustomerSave = () => {
        return Promise.reject({})
      }
      sinon.stub(importer.client.customers, 'save', mockCustomerSave)
      const customer = { email: 'test@test.de' }
      importer.importCustomer(customer)
      .then(() => {
        const actual = importer.summary.errors[0]
        const expected = {
          customer,
          error: {}
        }
        expect(actual).to.deep.equal(expected)
        importer.client.customers.save.restore()
        done()
      })
    })

    it(`should set shipping and billing address
    if corresponding options are set`, function (done) {
      sinon.spy(importer.client.customers, 'save')
      importer.config.defaultShippingAddress = 0
      importer.config.defaultBillingAddress = 0
      importer.importCustomer({ email: 'test@test.de', customerGroup: 'test' })
      .then(() => {
        const savedCustomer = importer.client.customers.save.getCall(0).args[0]
        const actual = _.pick(
          savedCustomer,
          ['defaultShippingAddressId', 'defaultBillingAddressId']
        )
        const expected = {
          defaultShippingAddressId: 0,
          defaultBillingAddressId: 0
        }
        expect(actual).to.deep.equal(expected)
        done()
      })
      .catch(done)
    })

  })

  describe('handling customer groups', () => {

    let importer
    const customerGroups = Array.from(new Array(10), () => ({
      id: cuid(), name: cuid()
    }))

    beforeEach(() => {
      importer = new CustomerImport(logger, options)
      customerGroups
      const mockGET = (endpoint, callback) => {
        callback(
          null,
          { statusCode: 200 },
          { results: customerGroups }
        )
      }
      const mockPOST = (endpoint, payload, callback) => {
        callback(
          null,
          { statusCode: 200 },
          { id: cuid() }
        )
      }
      sinon.stub(importer.client._rest, 'GET', mockGET)
      sinon.stub(importer.client._rest, 'POST', mockPOST)
    })

    afterEach(() => {
      importer.client._rest.GET.restore()
      importer.client._rest.POST.restore()
    })

    it('should load all customer groups', function (done) {
      importer.loadCustomerGroups()
      .then(() => {
        const actual = _.keys(importer.customerGroups).length
        const expected = 10
        expect(actual).to.equal(expected)
        done()
      })
      .catch(done)
    })

    it('should not reload customer groups', function (done) {
      const customerGroups = { 'commercetools': cuid() }
      importer.customerGroups = customerGroups
      importer.loadCustomerGroups()
      .then(() => {
        const actual = importer.customerGroups
        const expected = customerGroups
        expect(actual).to.deep.equal(expected)
        done()
      })
      .catch(done)
    })

    it('should store a mapping of customerName to customerId', function (done) {
      importer.loadCustomerGroups()
      .then(() => {
        customerGroups.forEach(({ name, id }) => {
          const expected = id
          const actual = importer.customerGroups[name]
          expect(actual).to.equal(expected)
        })
        done()
      })
      .catch(done)
    })

    it('should map a customer name to a customer id', function (done) {
      importer.loadCustomerGroups()
      .then(() => {
        importer.getCustomerGroupId(customerGroups[0].name)
        .then((id) => {
          const actual = id
          const expected = customerGroups[0].id
          expect(actual).to.equal(expected)
          done()
        })
      })
      .catch(done)
    })

    it('should insert new customer groups', function (done) {
      const newCustomerGroupName = cuid()
      importer.loadCustomerGroups()
      .then(() => {
        importer.getCustomerGroupId(newCustomerGroupName)
        .then((id) => {
          expect(id).not.to.be.undefined
        })
        done()
      })
      .catch(done)
    })

    it('should build the right create customer group payload', () => {
      sinon.spy(importer.client.customerGroups, 'create')
      const groupId = cuid()
      const actual = importer.buildCustomerGroupReference(groupId)
      const expected = { typeId: 'customer-group', id: groupId }

      expect(expected).to.deep.equal(actual)
    })

  })

})
