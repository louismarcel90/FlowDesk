package flowdesk.authz_lib

# Public function: allow_for(i) returns true/false
allow_for(i) {
  org_match(i)
  required_rank[i.action]
  role_rank[i.principal.role] >= required_rank[i.action]
}

# Public function: reason_for(i) returns a string
reason_for(i) = msg {
  not org_match(i)
  msg := "DENY: org mismatch"
} else = msg {
  not required_rank[i.action]
  msg := sprintf("DENY: unknown action %v", [i.action])
} else = msg {
  not role_rank[i.principal.role]
  msg := sprintf("DENY: unknown role %v", [i.principal.role])
} else = msg {
  role_rank[i.principal.role] < required_rank[i.action]
  msg := "DENY: insufficient role"
} else = msg {
  msg := "ALLOW"
}

# ---- Role hierarchy
role_rank := {
  "viewer": 1,
  "editor": 2,
  "approver": 3,
  "admin": 4,
}

# ---- Action -> minimum required role rank
required_rank := {
  "me.read": 1,
  "admin.policies.read": 4,

  "decision.read": 1,
  "decision.create": 2,
  "decision.update": 2,
  "decision.comment": 1,
  "decision.approve": 3,

  "initiative.read": 1,
  "initiative.create": 2,

  "metric.read": 1,
  "metric.create": 2,
  "metric.snapshot.create": 2,

  "decision.link": 2,

  "notifications.read": 1,
  "notifications.manage": 1,

  "notifications.inbox": 1,
  "notifications.read_one": 1,
  "notifications.read_all": 1,
  "notifications.stream": 1,

  "admin.ops.read": 4,
  "admin.ops.write": 4,


}

# ---- Org matching
org_match(i) {
  not i.resource.orgId
}

org_match(i) {
  i.resource.orgId == i.principal.orgId
}
