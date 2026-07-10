//! The shared tokio runtime for every async task the core ever runs. One static
//! multi-thread runtime, created lazily on first use and reused for the process
//! lifetime — FFI entry points must never build per-call or scoped runtimes.
//! When the first async capability gets an FFI surface, this graduates to the
//! explicit init/shutdown AppRuntime shape (isync / sha4x pattern).

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

/// The process-wide runtime. Spawn long-lived work with `runtime().spawn(...)`;
/// FFI callers that must wait use `runtime().block_on(...)` off the UI thread.
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

        // spawned work runs on the same shared runtime and can be awaited again
        let handle = runtime().spawn(async {
            tokio::time::sleep(std::time::Duration::from_millis(5)).await;
            7
        });
        assert_eq!(runtime().block_on(handle).unwrap(), 7);
    }
}
