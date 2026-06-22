const secureFind = (model, query, req) => {
  if (!req.studioId) throw new Error('studioId is missing from request');
  return model.find({ ...query, studioId: req.studioId });
};

const secureFindOne = (model, query, req) => {
  if (!req.studioId) throw new Error('studioId is missing from request');
  return model.findOne({ ...query, studioId: req.studioId });
};

module.exports = {
  secureFind,
  secureFindOne
};
