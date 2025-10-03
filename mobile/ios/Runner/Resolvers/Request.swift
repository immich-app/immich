class CancellationToken {
  var isCancelled = false
}

class Request {
  let cancellationToken: CancellationToken

  init(cancellationToken: CancellationToken) {
    self.cancellationToken = cancellationToken
  }
  
  var isCancelled: Bool {
    get {
      return cancellationToken.isCancelled
    }
    set(newValue) {
      cancellationToken.isCancelled = newValue
    }
  }
}
