export const requireScope = (scopeType) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !Array.isArray(user.scopes)) {
      return res.status(403).json({ error: 'INSUFFICIENT_SCOPE', message: 'No scopes defined for user.' });
    }

    const hasScope = user.scopes.some((s) => {
      if (!s || typeof s !== 'string') return false;
      const [type] = s.split(':');
      if (scopeType === 'global') return type === 'global';
      if (scopeType === 'state') return type === 'state';
      if (scopeType === 'hospital') return type === 'hospital';
      return false;
    });

    if (!hasScope) {
      return res.status(403).json({
        error: 'INSUFFICIENT_SCOPE',
        message: `Required ${scopeType} scope.`
      });
    }

    next();
  };
};
