# customer-import

[![Travis][travis-badge]][travis-url]
[![Codecov][codecov-badge]][codecov-url]
[![npm][npm-lic-badge]][npm-lic-url]
[![semantic-release][semantic-release-badge]][semantic-release-url]
[![Commitizen friendly][commitizen-badge]][commitizen-url]
[![NPM version][npm-image]][npm-url]

A library that helps with importing [customers](http://dev.commercetools.com/http-api-projects-customers.html) into the Commercetools Platform.  
This library is built to be used in conjunction with [sphere-node-cli](https://github.com/sphereio/sphere-node-cli).

## Features
- Import customers to your CTP project
- Pre-validate customers using a [JSON schema](https://github.com/sphereio/customer-import/blob/master/src/schema.js)
- generating a password for every new customer
- resolve a customer group name with the corresponding customer group reference
- create a customer group for the given name if none exists yet
- setting a default shipping and billing address

### Configuration
The configuration object may contain:
- `sphereClientConfig`: see the [sphere-node-sdk docs](http://sphereio.github.io/sphere-node-sdk/) for more information on this
- `defaultShippingAddress`: Index of the address in the customer's `addresses` list that should be used as the shipping address
- `defaultBillingAddress`: Index of the address in the customer's `addresses` list that should be used as the billing address

## Usage with `sphere-node-cli`

You can use the customer import from the command line using the [`sphere-node-cli`](https://github.com/sphereio/sphere-node-cli).
In order for the cli to import customer, the file to import from must be JSON and follow the this structure:
```
{
  "customers": [
    <customer>,
    <customer>,
    ...
  ]
}
```
Then you can import this file using the cli:
```bash
sphere-node-cli -t customer -p my-project-key -f /sample_dir/customers.json
```
You can pass a custom configuration as described above via the `-c` operator:
```bash
sphere-node-cli -t customer -p my-project-key -f /sample_dir/customers.json -c '{ "defaultShippingAddress": 0, "defaultBillingAddress": 0 }'
```

## Direct usage

If you want more control, you can also use this library directly in JavaScript. To do this you first need to install it:
```bash
npm install ct-customer-import --save-dev
```
Then you can use it to import customers like so:
```js
import CustomerImport from 'ct-customer-import'

const customer = {
  email: '<some-email>'
}
const config = {
  sphereClientConfig: {
    config: {
      project_key: <PROJECT_KEY>,
      client_id: '*********',
      client_secret: '*********'
    },
    defaultShippingAddress: 0, defaultBillingAddress: 0
  }
}
const customerImport = CustomerImport(config)

// load customer groups so they can be resolved to references
customerImport.loadCustomerGroups()
.then(() => customerImport.importCustomer(customer))
.then(() => {
  // done importing the customer
  // look at the summary to see errors
  customerImport.summary
  // the summary hast the following structure
  // {
  //   errors: [],
  //   inserted: [<some-email>],
  //   successfullImports: 1
  // }
})
```

[travis-badge]: https://img.shields.io/travis/sphereio/customer-import.svg?style=flat-square
[travis-url]: https://travis-ci.org/sphereio/customer-import

[codecov-badge]: https://img.shields.io/codecov/c/github/sphereio/customer-import.svg?style=flat-square
[codecov-url]: https://codecov.io/github/sphereio/customer-import

[npm-lic-badge]: https://img.shields.io/npm/l/ct-customer-import.svg?style=flat-square
[npm-lic-url]: http://spdx.org/licenses/MIT

[semantic-release-badge]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square
[semantic-release-url]: https://github.com/semantic-release/semantic-release

[commitizen-badge]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square
[commitizen-url]: http://commitizen.github.io/cz-cli/

[npm-url]: https://npmjs.org/package/ct-customer-import
[npm-image]: http://img.shields.io/npm/v/ct-customer-import.svg?style=flat-square
[npm-downloads-image]: https://img.shields.io/npm/dt/ct-customer-import.svg?style=flat-square
