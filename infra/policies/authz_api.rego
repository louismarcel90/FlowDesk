package flowdesk.authz

import data.flowdesk.authz_lib as lib

default allow = false

allow {
  lib.allow_for(input)
}

reason := lib.reason_for(input)
