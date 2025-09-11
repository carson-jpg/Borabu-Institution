module.exports = (...roles) => {
  return (req, res, next) => {
    console.log('Role check middleware: Checking roles:', roles);
    console.log('Role check middleware: User role:', req.user?.role);
    console.log('Role check middleware: User ID:', req.user?._id);

    if (!req.user) {
      console.log('Role check middleware: No user found in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      console.log('Role check middleware: User role not in allowed roles');
      console.log('Role check middleware: Allowed roles:', roles);
      console.log('Role check middleware: User role:', req.user.role);
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    console.log('Role check middleware: Access granted');
    next();
  };
};
