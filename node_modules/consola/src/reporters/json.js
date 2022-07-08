export default class JSONReporter {
  constructor ({ stream } = {}) {
    this.stream = stream || process.stdout
  }

  log (logObj) {
    this.stream.write(JSON.stringify(logObj) + '\n')
  }
}
