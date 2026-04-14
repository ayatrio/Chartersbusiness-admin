const CandidateAccess = require('../models/CandidateAccess');
const { normalizePermissions } = require('../utils/defaultPermissions');

exports.getInternalPermissions = async (req, res, next) => {
  try {
    const { chartersUserId } = req.params;
    const access = await CandidateAccess.findOne({ chartersUserId }).lean();

    return res.status(200).json({
      success: true,
      chartersUserId,
      permissions: normalizePermissions(access?.permissions || {}),
      userCategory: access?.userCategory || null,
      mirrorStatus: access?.status || null,
      source: 'profile-branding-metadata',
      updatedAt: access?.updatedAt || null,
    });
  } catch (error) {
    return next(error);
  }
};
