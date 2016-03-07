import { ProjectCredentialsConfig } from 'sphere-node-utils'

const getSphereClientCredentials = (projectKey) => {
  return ProjectCredentialsConfig.create()
  .then((credentials) => {
    const sphereCredentials = credentials.enrichCredentials({
      project_key: projectKey
    })
    return sphereCredentials
  })
}

const generatePassword = () => {
  return Math.random().toString(36).slice(2)
}

export {
  getSphereClientCredentials,
  generatePassword
}
