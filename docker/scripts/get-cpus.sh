#!/bin/sh

set -eu

LOG_LEVEL="${IMMICH_LOG_LEVEL:='info'}"

logDebug() {
    if [ "$LOG_LEVEL" = "debug" ] || [ "$LOG_LEVEL" = "verbose" ]; then
        echo "DEBUG: $1" >&2
    fi
}

if [ -f /sys/fs/cgroup/cgroup.controllers ]; then
    logDebug "cgroup v2 detected."
    if [ -f /sys/fs/cgroup/cpu.max ]; then
        read -r quota period </sys/fs/cgroup/cpu.max
        if [ "$quota" = "max" ]; then
            logDebug "No CPU limits set."
            unset quota period
        fi
    else
        logDebug "/sys/fs/cgroup/cpu.max not found."
    fi
else
    logDebug "cgroup v1 detected."

    if [ -f /sys/fs/cgroup/cpu/cpu.cfs_quota_us ] && [ -f /sys/fs/cgroup/cpu/cpu.cfs_period_us ]; then
        quota=$(cat /sys/fs/cgroup/cpu/cpu.cfs_quota_us)
        period=$(cat /sys/fs/cgroup/cpu/cpu.cfs_period_us)

        if [ "$quota" = "-1" ]; then
            logDebug "No CPU limits set."
            unset quota period
        fi
    else
        logDebug "/sys/fs/cgroup/cpu/cpu.cfs_quota_us or /sys/fs/cgroup/cpu/cpu.cfs_period_us not found."
    fi
fi

if [ -n "${quota:-}" ] && [ -n "${period:-}" ]; then
    cpus=$((quota / period))
    if [ "$cpus" -eq 0 ]; then
        cpus=1
    fi
else
    cpus=$(grep -c ^processor /proc/cpuinfo)
fi

echo "$cpus"
