const schema = {
  type: 'object',
  properties: {
    customerNumber: { type: 'string' },
    companyName: { type: 'string' },
    addresses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          streetName: { type: 'string' },
          postalCode:  { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string', minLength: 2, maxLength: 2 },
        }
      },
    },
    email: { type: 'string' },
    phone: { type: 'string' },
    customerGroup: { type: 'string' },
    vatId: { type: 'string' },
  },
  required: ['email'],
  additionalProperties: false,
}

export default schema
