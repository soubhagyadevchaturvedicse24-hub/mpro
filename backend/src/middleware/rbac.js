export const ROLE_PERMISSIONS = {
  PLATFORM_ADMIN: {
    permissions: ['hospital.view_all', 'hospital.approve', 'hospital.suspend', 'hospital.reject', 'audit.view.global', 'authorization_case.view', 'authorization_case.approve', 'mission:create', 'mission.create', 'transport:dispatch'],
    allowedScopes: ['global']
  },
  APPROPRIATE_AUTHORITY: {
    permissions: ['hospital.view_all', 'hospital.approve', 'hospital.suspend', 'hospital.reject', 'audit.view.global', 'mission:create', 'mission.create'],
    allowedScopes: ['state']
  },
  ROTTO_SOTTO_OFFICER: {
    permissions: ['hospital.view_all', 'allocation.view', 'allocation.approve', 'audit.view.global', 'authorization_case.view', 'donor_case.view', 'mission:create', 'mission.create', 'transport:dispatch'],
    allowedScopes: ['state', 'global']
  },
  HOSPITAL_COORDINATOR: {
    permissions: ['hospital.update_own', 'donor_case.create', 'donor_case.view', 'transplant.log', 'brain_death.initiate', 'mission:view', 'transport:dispatch', 'transport:arrive'],
    allowedScopes: ['hospital']
  },
  TRANSPLANT_SURGEON: {
    permissions: ['donor_case.view', 'brain_death.certify'],
    allowedScopes: ['hospital']
  },
  ICU_NODAL_OFFICER: {
    permissions: ['donor_case.create', 'donor_case.view', 'brain_death.initiate'],
    allowedScopes: ['hospital']
  },
  NOTTO_OFFICER: {
    permissions: ['hospital.view_all', 'authorization_case.view', 'donor_case.view', 'audit.view.global', 'mission:create', 'mission.create', 'transport:dispatch'],
    allowedScopes: ['global']
  },
  AUTHORIZATION_COMMITTEE_MEMBER: {
    permissions: ['authorization_case.view', 'authorization_case.approve', 'authorization_case.reject'],
    allowedScopes: ['state', 'hospital']
  },
  AUDITOR: {
    permissions: ['audit.view.global'],
    allowedScopes: ['global', 'state']
  }
};

export const requirePermission = (permissionCode) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const rolePerms = ROLE_PERMISSIONS[user.role];
      const allowed = Array.isArray(rolePerms?.permissions)
        ? rolePerms.permissions.includes(permissionCode)
        : Array.isArray(rolePerms)
          ? rolePerms.includes(permissionCode)
          : false;

      if (!allowed) {
        return res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS', message: 'You do not have permission to perform this action' });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requirePermissionWithScope = (permissionCode, scopeType) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.role) {
      return res.status(403).json({ error: 'UNAUTHENTICATED' });
    }

    const rolePerms = ROLE_PERMISSIONS[user.role];
    if (!rolePerms) {
      return res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS' });
    }

    const hasPermission = Array.isArray(rolePerms.permissions)
      ? rolePerms.permissions.includes(permissionCode)
      : Array.isArray(rolePerms)
        ? rolePerms.includes(permissionCode)
        : false;

    if (!hasPermission) {
      return res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS' });
    }

    if (scopeType) {
      const scopes = user.scopes || [];
      const hasScope = scopes.some((s) => {
        if (!s || typeof s !== 'string') return false;
        const [type] = s.split(':');
        return type === scopeType;
      });

      if (!hasScope) {
        return res.status(403).json({ error: 'INSUFFICIENT_SCOPE' });
      }
    }

    next();
  };
};
