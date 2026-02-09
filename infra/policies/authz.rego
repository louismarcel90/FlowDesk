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
}

org_match {
  input.resource.orgId == input.principal.orgId
}


allow {
  org_match
  required_rank[input.action]
  role_rank[input.principal.role] >= required_rank[input.action]
}

reason := msg {
  allow
  msg := "ALLOW"
} else := msg {
  msg := "DENY: insufficient role or org mismatch"
}

rule := "flowdesk.authz/allow"
