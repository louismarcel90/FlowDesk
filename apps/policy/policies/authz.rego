package flowdesk.authz

default allow := false

# input:
# {
#   "principal": { "userId": "...", "orgId": "...", "role": "viewer|editor|approver|admin" },
#   "action": "me.read" | "decision.read" | ...,
#   "resource": { "type": "me|decision|...", "id": "...", "orgId": "..." }
# }

role_rank := {
  "viewer": 1,
  "editor": 2,
  "approver": 3,
  "admin": 4
}

required_rank := {
  "me.read": 1,
  "admin.policies.read": 4
}

# guard: principal/org must match resource.orgId when present
org_match {
  not input.resource.orgId
} else {
  input.resource.orgId == input.principal.orgId
}

allow {
  org_match
  role_rank[input.principal.role] >= required_rank[input.action]
}

reason := "DENY: insufficient role or org mismatch" if {
  not allow
}

rule := "flowdesk.authz/allow"
