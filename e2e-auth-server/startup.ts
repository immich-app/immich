import setup from './auth-server'

const teardown = await setup()
process.on('exit', () => {
  teardown()
  console.log('[e2e-auth-server] stopped')
  process.exit(0)
})
