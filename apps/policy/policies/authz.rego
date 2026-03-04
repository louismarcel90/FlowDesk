package flowdesk.apps_authz

import data.flowdesk.authz_lib as lib


allow if {
  lib.allow_for(input)
}

reason := lib.reason_for(input)
