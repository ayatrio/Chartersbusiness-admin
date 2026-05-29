// const jwt = require('jsonwebtoken');
// const Admin = require('../models/Admin');
// const UserModelRaw = require('../models/User.model');
// const UserModel = UserModelRaw.default || UserModelRaw;

// const ALLOWED_ADMIN_ROLES = new Set(['admin', 'recruiter']);

// // Protect routes
// exports.protect = async (req, res, next) => {
//   try {
//     let token;

//     if (
//       req.headers.authorization &&
//       req.headers.authorization.startsWith('Bearer ')
//     ) {
//       token = req.headers.authorization.split(' ')[1];
//     }

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: 'Not authorized. Please log in.',
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Admin tokens minted by /api/admin/auth/login carry Charters identity only.
//     if (decoded.tokenType === 'pb_admin') {
//       const role = String(decoded.role || '').toLowerCase();

//       if (!ALLOWED_ADMIN_ROLES.has(role) || !decoded.chartersUserId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Invalid admin session.',
//         });
//       }

//       req.user = {
//         _id: decoded.chartersUserId,
//         chartersUserId: decoded.chartersUserId,
//         email: decoded.email || null,
//         name: decoded.name || 'Admin',
//         role,
//         tokenType: 'pb_admin',
//       };

//       return next();
//     }

//     // Attempt to find in Admin collection first
//     let admin = await Admin.findById(decoded.id);
    
//     // If not found in Admin, try the User collection
//     if (!admin) {
//       admin = await UserModel.findById(decoded.id);
//     }

//     if (!admin || !admin.isActive) {
//       return res.status(401).json({
//         success: false,
//         message: 'Account not found or inactive.',
//       });
//     }

//     // Token invalidation check for local PB candidate/user accounts.
//     // If it's a regular user, permissionsVersion might be undefined.
//     if (admin.permissionsVersion !== undefined && decoded.permissionsVersion !== admin.permissionsVersion) {
//       return res.status(401).json({
//         success: false,
//         message: 'Session expired. Please login again.',
//       });
//     }

//     req.user = admin;
//     next();
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: 'Invalid or expired token.',
//     });
//   }
// };

// // Admin only
// exports.requireAdmin = (req, res, next) => {
//   if (!ALLOWED_ADMIN_ROLES.has(String(req.user?.role || '').toLowerCase())) {
//     return res.status(403).json({
//       success: false,
//       message: 'Admin access required',
//     });
//   }
//   next();
// };

// // Feature-level access
// exports.checkFeatureAccess = (tool, feature) => {
//   return (req, res, next) => {
//     if (ALLOWED_ADMIN_ROLES.has(String(req.user?.role || '').toLowerCase())) {
//       return next();
//     }

//     const hasAccess =
//       req.user.permissions &&
//       req.user.permissions[tool] &&
//       req.user.permissions[tool][feature];

//     if (!hasAccess) {
//       return res.status(403).json({
//         success: false,
//         message: `Access denied: ${tool}.${feature}`,
//       });
//     }

//     next();
//   };
// };

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const UserModelRaw = require('../models/User.model');
const UserModel = UserModelRaw.default || UserModelRaw;

const ALLOWED_ADMIN_ROLES = new Set(['admin', 'recruiter']);

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please log in.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Admin tokens minted by /api/admin/auth/login carry Charters identity only.
    if (decoded.tokenType === 'pb_admin') {
      const role = String(decoded.role || '').toLowerCase();

      if (!ALLOWED_ADMIN_ROLES.has(role) || !decoded.chartersUserId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin session.',
        });
      }

      req.user = {
        _id: decoded.chartersUserId,
        chartersUserId: decoded.chartersUserId,
        email: decoded.email || null,
        name: decoded.name || 'Admin',
        role,
        tokenType: 'pb_admin',
        id: decoded.chartersUserId,
      };

      return next();
    }

    // Attempt to find in Admin collection first, then User (student accounts)
    let user = await Admin.findById(decoded.id);

    if (!user) {
      const rawUser = await UserModel.findById(decoded.id);
      if (rawUser) {
        user = rawUser.toObject();
        user.id = String(rawUser._id);
        
        if (user.role === 'admin' || user.role === 'recruiter') {
          // Merge permissions and permissionsVersion from Admin collection if exists
          const adminDoc = await Admin.findOne({ email: user.email });
          if (adminDoc) {
            user.permissions = adminDoc.permissions || {};
            user.permissionsVersion = adminDoc.permissionsVersion || 0;
          } else {
            user.permissions = {};
            user.permissionsVersion = 0;
          }
        } else {
          // Fetch permissions and status from CandidateAccess
          const CandidateAccess = require('../models/CandidateAccess');
          const access = await CandidateAccess.findOne({ chartersUserId: String(rawUser._id) });
          if (access) {
            user.permissions = access.permissions || {};
            user.userCategory = access.userCategory || 'user';
            if (access.status) {
              user.status = access.status;
            }
            if (access.userCategory === 'candidate') {
              user.role = 'candidate';
            }
          } else {
            user.permissions = {};
            user.userCategory = 'user';
          }
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found.',
      });
    }

    // ── Active check: support both the legacy isActive boolean AND
    //    the newer status string, whichever the document actually has. ──
    const isActive =
      typeof user.status === 'string'
        ? user.status === 'active'
        : Boolean(user.isActive);          // fallback for older Admin docs

    if (!isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive or disabled.',
      });
    }

    // Token invalidation check — only applies to accounts that carry permissionsVersion.
    if (
      user.permissionsVersion !== undefined &&
      decoded.permissionsVersion !== user.permissionsVersion
    ) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
      });
    }

    if (user && !user.id && user._id) {
      user.id = String(user._id);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

// Admin only
exports.requireAdmin = (req, res, next) => {
  if (!ALLOWED_ADMIN_ROLES.has(String(req.user?.role || '').toLowerCase())) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

// Feature-level access
exports.checkFeatureAccess = (tool, feature) => {
  return (req, res, next) => {
    if (ALLOWED_ADMIN_ROLES.has(String(req.user?.role || '').toLowerCase())) {
      return next();
    }

    const hasAccess =
      req.user.permissions &&
      req.user.permissions[tool] &&
      req.user.permissions[tool][feature];

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Access denied: ${tool}.${feature}`,
      });
    }

    next();
  };
};
