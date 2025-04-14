# PostgreSQL User Name Maps
# =========================
#
# Refer to the PostgreSQL documentation, chapter "Client
# Authentication" for a complete description.  A short synopsis
# follows.
#
# This file controls PostgreSQL user name mapping.  It maps external
# user names to their corresponding PostgreSQL user names.  Records
# are of the form:
#
# MAPNAME  SYSTEM-USERNAME  PG-USERNAME
#
# (The uppercase quantities must be replaced by actual values.)
#
# MAPNAME is the (otherwise freely chosen) map name that was used in
# pg_hba.conf.  SYSTEM-USERNAME is the detected user name of the
# client.  PG-USERNAME is the requested PostgreSQL user name.  The
# existence of a record specifies that SYSTEM-USERNAME may connect as
# PG-USERNAME.
#
# If SYSTEM-USERNAME starts with a slash (/), it will be treated as a
# regular expression.  Optionally this can contain a capture (a
# parenthesized subexpression).  The substring matching the capture
# will be substituted for \1 (backslash-one) if present in
# PG-USERNAME.
#
# Multiple maps may be specified in this file and used by pg_hba.conf.
#
# No map names are defined in the default configuration.  If all
# system user names and PostgreSQL user names are the same, you don't
# need anything in this file.
#
# This file is read on server startup and when the postmaster receives
# a SIGHUP signal.  If you edit the file on a running system, you have
# to SIGHUP the postmaster for the changes to take effect.  You can
# use "pg_ctl reload" to do that.

# Put your actual configuration here
# ----------------------------------

# MAPNAME       SYSTEM-USERNAME         PG-USERNAME
