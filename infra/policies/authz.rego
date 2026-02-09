package flowdesk.authz_lib

# Public function: allow_for(i) returns true/false
allow_for(i) {
  org_match(i)
  required_rank[i.action]
  role_rank[i.principal.role] >= required_rank[i.action]
}

reason_for(i) = msg {
  allow_for(i)
  msg := "ALLOW"
} else = msg {
  msg := "DENY: insufficient role or org mismatch"
}

role_rank := {
  "viewer": 1,
  "editor": 2,
  "approver": 3,
  "admin": 4,
}

required_rank := {
  "me.read": 1,
  "admin.policies.read": 4,

  "decision.read": 1,
  "decision.create": 2,
  "decision.update": 2,
  "decision.comment": 1,
  "decision.approve": 3,
}

org_match(i) {
  not i.resource.orgId
}

org_match(i) {
  i.resource.orgId == i.principal.orgId
}
