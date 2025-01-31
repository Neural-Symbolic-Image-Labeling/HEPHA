const { default: mongoose } = require("mongoose");
const { ErrorResponse } = require("../models/ErrorResponse");
const { Workspace } = require("../models/Workspace");

const authWorkspace = async (req, res, next) => {
  if (req.session.workspaceId) {
    try {
      const workspace = await Workspace.findById(req.session.workspaceId);
      if(workspace) {
        req.workspace = workspace;
        next();
        return;
      }
      else {
        res.status(404).json(new ErrorResponse(-1, "Workspace not found"));
        return;
      }
    } catch (err) {
      res.status(401).json(new ErrorResponse(0, "Database error"));
      return;
    }
  }
  res.status(401).json(new ErrorResponse(-1, "Session expired"));
};

const authAdmin = async (req, res, next) => { 
  if (req.session.admin) {
    next();
  } else {
    res.status(401).json(new ErrorResponse(-1, "Unarthorized"));
  }
};

const uuidValidator = (req, res, next) => {
  if (req.params.uuid && mongoose.Types.ObjectId.isValid(req.params.uuid)) {
    next();
    return;
  }
  res.status(400).json(new ErrorResponse(1, "Invalid uuid"));
};


module.exports = {
  authWorkspace,
  authAdmin,
  uuidValidator,
}