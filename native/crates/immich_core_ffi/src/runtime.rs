//! Shared Tokio runtime for FFI work.

use std::sync::LazyLock;
use tokio::runtime::{Builder, Runtime};

static RUNTIME: LazyLock<Runtime> = LazyLock::new(|| {
    Builder::new_multi_thread()
        .worker_threads(2)
        .thread_name("immich-core")
        .enable_time()
        .build()
        .unwrap_or_else(|e| panic!("immich-core runtime failed to start: {e}"))
});

/// Returns the process-wide runtime.
pub fn runtime() -> &'static Runtime {
    &RUNTIME
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used)]
    use super::*;

    #[test]
    fn runtime_is_shared_and_reusable() {
        let a = runtime() as *const Runtime;
        let b = runtime() as *const Runtime;
        assert_eq!(a, b);

        let first = runtime().block_on(async { 21 * 2 });
        assert_eq!(first, 42);

        let handle = runtime().spawn(async {
            tokio::time::sleep(std::time::Duration::from_millis(5)).await;
            7
        });
        assert_eq!(runtime().block_on(handle).unwrap(), 7);
    }
}
