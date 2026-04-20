const aiInterviewService = require('../services/aiInterviewService');

exports.getModuleHealth = async (req, res, next) => {
  try {
    const result = await aiInterviewService.healthCheck({ user: req.user });
    res.status(200).json({
      success: true,
      module: 'aiInterview',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getInterviewToken = async (req, res, next) => {
  try {
    const roomId = req.query?.roomId || req.body?.roomId;
    const result = await aiInterviewService.createInterviewToken({
      roomId,
      requestId: req.requestId,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

exports.scoreLanguageChunk = async (req, res, next) => {
  try {
    const text = req.body?.text;
    const result = await aiInterviewService.scoreLanguage({
      text,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
