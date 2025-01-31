const router = require("express").Router();
const { ErrorResponse } = require("../../models/ErrorResponse");
const { ImageSet } = require("../../models/Image");
const { Workspace } = require("../../models/Workspace");
const { authWorkspace } = require("../../utils");
const {
  createWorkspace,
  collectionBuilder,
  requestLabel,
  requestBaselineLabel,
} = require("./manager");

const getPath = (path) => `/workspace${path}`;

router.post(getPath("/login"), async (req, res) => {
  if (req.body) {
    /**@type {import('./request').LoginRequest} */
    const reqBody = req.body;
    const workspace = await Workspace.findOne({ name: reqBody.workspaceName })
      .select("-logs")
      .lean();
    if (workspace) {
      req.session.workspaceId = workspace._id;
      res.status(200).json(workspace);
    } else {
      // create a new workspace
      try {
        const nws = await createWorkspace(reqBody.workspaceName);
        const ws = new Workspace(nws);
        ws.markModified("collections.restrictions");
        const result = await ws.save();
        req.session.workspaceId = result._id;
        res.status(200).json(result);
      } catch (err) {
        res
          .status(500)
          .json(new ErrorResponse(0, "Failed to create workspace", err));
      }
    }
    return;
  }
  res.status(400).json(new ErrorResponse(2, "request body is required"));
});

router.get(getPath("/auto"), authWorkspace, (req, res) => {
  res.status(200).json(req.workspace);
});

router.post(getPath("/collection"), async (req, res) => {
  if (req.body) {
    /**@type {import('./request').NewCollectionRequest} */
    const reqBody = req.body;
    try {
      const workspaceDoc = await Workspace.findById(reqBody.workspaceId);
      const imgSetDoc = await ImageSet.findOne({
        name: reqBody.setName,
      }).lean();
      const newCollection = await collectionBuilder(imgSetDoc);
      workspaceDoc.collections.push(newCollection);
      workspaceDoc.markModified("collections.birdPredicates");
      workspaceDoc.markModified("collections.restrictions");
      const result = await workspaceDoc.save();
      res
        .status(200)
        .json(
          result.collections
            .find((c) => c.name === reqBody.setName)
            ._id.toString()
        );
      return;
    } catch (err) {
      res
        .status(500)
        .json(new ErrorResponse(0, "Failed to add collection", err));
      return;
    }
  }
  res.status(400).json(new ErrorResponse(2, "request body is required"));
});

router.post(getPath("/label"), async (req, res) => {
  if (req.body) {
    /**@type {import('./request').AutoLabelRequest} */
    const reqBody = req.body;
    try {
      // get test image ids
      let workspace = await Workspace.findById(reqBody.workspaceId);
      let collection = workspace.collections.find(
        (c) => c._id.toString() === reqBody.collectionId
      );
      const test_img_ids = collection.test;

      const result = await requestLabel(
        reqBody.workspaceId,
        reqBody.collectionId,
        reqBody.mode,
        test_img_ids,
        reqBody.task,
        reqBody.rule,
        reqBody.image_set_name,
        reqBody.active_learning
      );
      console.log(result);

      // if the log is not empty, update the workspace
      if (req.body.log) {
        workspace = await Workspace.findById(reqBody.workspaceId);
        collection = workspace.collections.find(
          (c) => c._id.toString() === reqBody.collectionId
        );
        collection.logs.push(req.body.log);
        await workspace.save();
      }

      res.status(200).json(result);
      return;
    } catch (err) {
      console.log(err);
      res.status(500).json(new ErrorResponse(0, "Failed to request foil", err));
      return;
    }
  } else {
    res.status(400).json(new ErrorResponse(2, "request body is required"));
    return;
  }
});

router.post(getPath("/updaterules"), authWorkspace, async (req, res) => {
  if (req.body) {
    /**@type {import('./request').UpdateRuleRequest} */
    const reqBody = req.body;
    const collection = req.workspace.collections.find(
      (c) => c._id.toString() === reqBody.collectionId
    );
    if (!collection) {
      res.status(404).json(new ErrorResponse(0, "Collection not found"));
      return;
    }
    collection.rules = reqBody.rules;
    try {
      await req.workspace.save();
      res.status(200).json({ message: "success" });
      return;
    } catch (err) {
      res.status(500).json(new ErrorResponse(0, "Failed to update rule", err));
      return;
    }
  } else {
    res.status(400).json(new ErrorResponse(2, "request body is required"));
    return;
  }
});

router.post(
  getPath("/updateImageMetaData"),
  authWorkspace,
  async (req, res) => {
    if (req.body) {
      /**@type {import('./request').UpdateImageMetaDataRequest} */
      const reqBody = req.body;
      try {
        // find the collection
        const collection = req.workspace.collections.find(
          (c) => c._id.toString() === reqBody.collectionId
        );
        if (!collection) {
          res.status(404).json(new ErrorResponse(0, "Collection not found"));
          return;
        }
        // update labels
        let indexI = collection.images.findIndex(
          (img) => img.imageId === reqBody.imgId
        );
        if (indexI === -1) {
          res.status(404).json(new ErrorResponse(0, "Image not found"));
          return;
        }
        collection.images[indexI] = reqBody.data;
        await req.workspace.save();
        res.status(200).json({ message: "success" });
        return;
      } catch (err) {
        res
          .status(500)
          .json(new ErrorResponse(0, "Failed to update image metadata", err));
        return;
      }
    }
  }
);

router.post(getPath("/updateStatistics"), authWorkspace, async (req, res) => {
  if (req.body) {
    /**@type {import('./request').UpdateStatisticsRequest} */
    const reqBody = req.body;
    try {
      // find the collection
      const collection = req.workspace.collections.find(
        (c) => c._id.toString() === reqBody.collectionId
      );
      if (!collection) {
        res.status(404).json(new ErrorResponse(0, "Collection not found"));
        return;
      }
      // update labels
      collection.statistics = reqBody.data;
      await req.workspace.save();
      res.status(200).json({ message: "success" });
      return;
    } catch (err) {
      res
        .status(500)
        .json(new ErrorResponse(0, "Failed to update statistics", err));
      return;
    }
  }
});

router.post(getPath("/updateMode"), authWorkspace, async (req, res) => {
  if (req.body) {
    /**@type {import('./request').UpdateModeRequest} */
    const reqBody = req.body;
    try {
      // find the collection
      const collection = req.workspace.collections.find(
        (c) => c._id.toString() === reqBody.collectionId
      );
      if (!collection) {
        res.status(404).json(new ErrorResponse(0, "Collection not found"));
        return;
      }
      // update labels
      collection.method = reqBody.mode;
      await req.workspace.save();
      res.status(200).json({ message: "success" });
      return;
    } catch (err) {
      res.status(500).json(new ErrorResponse(0, "Failed to update mode", err));
      return;
    }
  }
});

// router.post(getPath('/baseline'), authWorkspace, async (req, res) => {
//   if (req.body) {
//     /**@type {import('./request').BaselineRequest} */
//     const reqBody = req.body;
//     try {
//       const result = await requestBaselineLabel(reqBody.workspaceId, reqBody.collectionId, reqBody.mode, 'baseline', reqBody.imgSetName);
//       console.log(result);

//       // if the log is not empty, update the workspace
//       if (req.body.log) {
//         const workspace = await Workspace.findById(reqBody.workspaceId);
//         const collection = workspace.collections.find(c => c._id.toString() === reqBody.collectionId);
//         collection.logs.push(req.body.log);
//         await workspace.save();
//       }

//       res.status(200).json(result);
//       return;
//     } catch (err) {
//       console.log(err);
//       res.status(500).json(new ErrorResponse(0, "Failed to request baseline", err));
//       return;
//     }
//   } else {
//     res.status(400).json(new ErrorResponse(2, "request body is required"));
//     return;
//   }
// });

router.post(getPath("/resnet"), authWorkspace, async (req, res) => {
  if (req.body) {
    /**@type {import('./request').BaselineRequest} */
    const reqBody = req.body;
    try {
      let workspace = await Workspace.findById(reqBody.workspaceId);
      let collection = workspace.collections.find(
        (c) => c._id.toString() === reqBody.collectionId
      );
      const test_img_ids = collection.test;

      const result = await requestBaselineLabel(
        reqBody.workspaceId,
        reqBody.collectionId,
        reqBody.mode,
        test_img_ids,
        reqBody.imgSetName,
        reqBody.resnet_model
      );
      console.log(result);
      res.status(200).json(result);
      return;
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json(new ErrorResponse(0, "Failed to request baseline", err));
      return;
    }
  } else {
    res.status(400).json(new ErrorResponse(2, "request body is required"));
    return;
  }
});

router.post(getPath("/updateLogs"), authWorkspace, async (req, res) => {
  if (req.body) {
    /**@type {import('./request').UpdateLogsRequest} */
    const reqBody = req.body;
    const workspace = req.workspace;
    try {
      // check if there is logs already
      let exists = false;
      for (let i = 0; i < workspace.logs.length; i++) {
        let log = workspace.logs[i];
        if (
          log.collectionName === reqBody.collectionName &&
          log.workspaceName === reqBody.workspaceName
        ) {
          // console.log("found");
          exists = true;
          // only append the new logs
          workspace.logs[i].states.push(reqBody.state);
          // console.log(JSON.stringify(workspace.logs[i].states.length));
          break;
        }
      }
      // check if the logs is not initialized
      if (!exists) {
        // console.log("new");
        const newLog = {
          collectionName: reqBody.collectionName,
          workspaceName: reqBody.workspaceName,
          states: [reqBody.state],
        };
        workspace.logs.push(newLog);
      }

      // update the workspace
      workspace.markModified("logs");
      await workspace.save();

      res.status(200).json({ message: "success" });
      return;
    } catch (err) {
      res.status(500).json(new ErrorResponse(0, "Failed to update logs", err));
      return;
    }
  } else {
    res.status(400).json(new ErrorResponse(2, "request body is required"));
    return;
  }
});

module.exports = { router };
