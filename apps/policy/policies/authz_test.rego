package flowdesk.authz

test_allow_me_read_viewer {
  allow with input as {
    "principal": {"userId":"u1","orgId":"o1","role":"viewer"},
    "action":"me.read",
    "resource":{"type":"me","id":"u1","orgId":"o1"}
  }
}

test_deny_admin_read_viewer {
  not allow with input as {
    "principal": {"userId":"u1","orgId":"o1","role":"viewer"},
    "action":"admin.policies.read",
    "resource":{"type":"policy","id":"*", "orgId":"o1"}
  }
}

test_deny_org_mismatch {
  not allow with input as {
    "principal": {"userId":"u1","orgId":"o1","role":"admin"},
    "action":"me.read",
    "resource":{"type":"me","id":"u1","orgId":"o2"}
  }
}
