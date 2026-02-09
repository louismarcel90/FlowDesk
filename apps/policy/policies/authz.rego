package flowdesk.authz

import data.flowdesk.authz_lib as lib

default allow := false

allow {
  lib.allow_for(input)
}

reason = r {
  r := lib.reason_for(input)
}

rule := "flowdesk.authz/allow"
