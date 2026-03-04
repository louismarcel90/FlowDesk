package flowdesk.authz_test

import data.flowdesk.authz.allow

test_allow_me_read_viewer if {
  allow with input as {
    "principal": {"userId": "u1", "orgId": "o1", "role": "viewer"},
    "action": "me.read",
    "resource": {"type": "me", "id": "u1", "orgId": "o1"},
  }
}

test_deny_admin_read_viewer if {
  not allow with input as {
    "principal": {"userId": "u1", "orgId": "o1", "role": "viewer"},
    "action": "admin.policies.read",
    "resource": {"type": "policy", "id": "*", "orgId": "o1"},
  }
}

test_deny_org_mismatch if {
  not allow with input as {
    "principal": {"userId": "u1", "orgId": "o1", "role": "admin"},
    "action": "me.read",
    "resource": {"type": "me", "id": "u1", "orgId": "o2"},
  }
}
