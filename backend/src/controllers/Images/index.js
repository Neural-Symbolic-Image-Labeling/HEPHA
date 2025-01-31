const router = require('express').Router();
const { ErrorResponse } = require('../../models/ErrorResponse');
const { ImageSet, Image } = require('../../models/Image');
const { authAdmin, uuidValidator } = require('../../utils');
const { requestForInterpretation } = require('./manager');
const fs = require('fs');
const multer = require('multer');

const upload = multer({ dest: 'temp/' });
const getPath = (path) => `/img${path}`;

router.get(getPath("/auto"), authAdmin, async (req, res) => {
  res.json({ message: "success" });
});

router.get(getPath("/setNames"), async (req, res) => {
  try {
    const sets = await ImageSet.find({}).lean();
    /**@type {import("./response").AllSetNamesResponse} */
    const setNames = sets.map(set => set.name);
    res.status(200).json(setNames);
    return;
  } catch (err) {
    res.status(500).json(new ErrorResponse(0, "Database Error", err));
  }
});

router.post(getPath("/set"), authAdmin, async (req, res) => {
  if (req.body) {
    /**@type {import("./request").CreateNewSetRequest} */
    const reqBody = req.body;
    const set = new ImageSet({
      name: reqBody.name,
      images: [],
    });
    try {
      await set.save();
      res.status(200).json({ message: "success" });
      return;
    } catch (err) {
      res.status(500).json(new ErrorResponse(0, "Database Error", err));
      return;
    }
  }
  res.status(400).json(new ErrorResponse(2, "Invalid Request", "No body provided"));
});

router.post(getPath('/auth'), async (req, res) => {
  if (req.body) {
    /**@type {import('./request').AuthRequest} */
    const reqBody = req.body;
    if (reqBody.token === (process.env.authToken || 'admin')) {
      req.session.admin = true;
      res.status(200).json({ message: "success" });
      return;
    }
    else {
      res.status(401).json(new ErrorResponse(-1, "Invalid token"));
      return;
    }
  }
  res.status(400).send(new ErrorResponse(2, "Request body is missing"));
});

router.post(getPath('/'), authAdmin, async (req, res) => {
  if (req.body) {
    /**@type {import('./request').ImageUploadRequest} */
    const reqBody = req.body;
    // find image set first
    const imgSet = await ImageSet.findOne({ name: reqBody.imageSetName });
    if (!imgSet) {
      res.status(404).json(new ErrorResponse(-1, "Image set not found"));
      return;
    }
    // create image data
    const image = new Image({
      ...reqBody.data,
      interpretation: null, // TODO: process image by object detection model
    });
    let imageData = null;
    try {
      // add image to image set
      imageData = await image.save();
    } catch (err) {
      res.status(500).json(new ErrorResponse(0, "Failed to save image", err));
      return;
    }
    try {
      // add image to image set
      imgSet.images.push(imageData._id);
      await imgSet.save();
      // ask for image interpretation
      requestForInterpretation(imageData._id).catch(err => { console.log(err); });
      res.status(200).send({ message: "success" });
      return;
    } catch (err) {
      await image.remove();
      res.status(500).send(new ErrorResponse(0, "Database Error", err));
      return;
    }

  }
  res.status(400).send(new ErrorResponse(2, "Request body is missing"));
  return;
});

router.get(getPath("/:uuid"), uuidValidator, async (req, res) => {
  const { uuid } = req.params;
  const data = await Image.findById(uuid).select('data -_id');
  const imgData = data.data;
  if (imgData) {
    const temp = imgData.split(",");
    let ext = temp[0].split(";")[0].split("/")[1];
    let img = Buffer.from(temp[1], 'base64');
    res.writeHead(200, {
      'Content-Type': `image/${ext}`,
      'Content-Length': img.length,
    });
    res.end(img);
    return;
  }
  res.status(404).send(new ErrorResponse(-1, "Image not found"));
});

router.get(getPath("/mask/:uuid"), uuidValidator, async (req, res) => {
  const { uuid } = req.params;
  const data = await Image.findById(uuid).select('mask -_id');
  const imgData = data.mask;
  if (imgData) {
    const temp = imgData.split(",");
    let ext = temp[0].split(";")[0].split("/")[1];
    let img = Buffer.from(temp[1], 'base64');
    res.writeHead(200, {
      'Content-Type': `image/${ext}`,
      'Content-Length': img.length,
    });
    res.end(img);
    return;
  }
  res.status(404).send(new ErrorResponse(-1, "Image not found"));
});

router.get(getPath("/interpretation/:uuid"), uuidValidator, async (req, res) => {
  const { uuid } = req.params;
  const imgData = await Image.findById(uuid).select('interpretation').lean();
  if (imgData && imgData['interpretation'] && imgData['interpretation']['object_detect']) {
    res.status(200).json(imgData['interpretation']['object_detect']);
    return;
  }
  res.status(404).send(new ErrorResponse(-1, `Image ${uuid} not found or interpretation not available`));
})

router.delete(getPath('/all'), authAdmin, async (req, res) => {
  try {
    await ImageSet.deleteMany({});
    await Image.deleteMany({});
    res.status(200).send({ message: "success" });
    return;
  } catch (err) {
    res.status(500).send(new ErrorResponse(0, "Failed to delete images", err));
    return;
  }
});

router.post(getPath('/setByJSON'), authAdmin, upload.fields([{ name: 'files' }, { name: 'test' }]), (req, res) => {
  try {
    const uploadedFiles = req.files.files;
    const uploadedTestFiles = req.files.test;
    const imgSetName = req.body.name;
    const imgSetType = req.body.type || 'Default';

    console.log(uploadedFiles, uploadedTestFiles, imgSetName, imgSetType);

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).send({ error: 'No files uploaded.' });
    }
    // console.log(uploadedFiles[0]);
    let parsedData = uploadedFiles.map(file => JSON.parse(fs.readFileSync(file.path, 'utf8')));
    let parsedTestData = uploadedTestFiles.map(file => JSON.parse(fs.readFileSync(file.path, 'utf8')));
    // conbine all data into one array since every parsedData is an array
    parsedData = [].concat.apply([], parsedData);
    parsedTestData = [].concat.apply([], parsedTestData);

    const uploadedTestImgIds = [];
    const testLabelSet = new Set();
    const uploadedImgIds = [];
    const labelSet = new Set();

    // bird specific
    // const birdPredicates = new Set();

    for (let i = 0; i < parsedData.length; i++) {
      const imgData = parsedData[i];
      const label = imgData['label'];
      labelSet.add(label);
    }

    for (let i = 0; i < parsedTestData.length; i++) {
      const imgData = parsedTestData[i];
      const label = imgData['label'];
      testLabelSet.add(label);
    }

    // create Image for each item in parsedData and then upload to the database using promise.all
    Promise.all(parsedData.map(async (imgData) => {
      const label = imgData['label'];
      labelSet.add(label);
      // if (imgSetType === 'Bird') {
      //   const preds = imgData['interpretation']['object_detect'];
      //   for (let key of Object.keys(preds)) {
      //     birdPredicates.add(key);
      //   }
      // }
      const image = new Image(imgData);
      const imageData = await image.save();
      uploadedImgIds.push(imageData._id);
    })).then(async () => {
      // process test data
      Promise.all(parsedTestData.map(async (imgData) => {
        const label = imgData['label'];
        testLabelSet.add(label);
        const image = new Image(imgData);
        const imageData = await image.save();
        uploadedTestImgIds.push(imageData._id);
      })).then(async () => {
        // create ImageSet and upload to the database
        const imageSet = new ImageSet({
          name: imgSetName,
          images: uploadedImgIds,
          test: uploadedTestImgIds,
          testLabelOptions: Array.from(testLabelSet),
          labelOptions: Array.from(labelSet),
          type: imgSetType,
        });
        // if (imgSetType === 'Bird') {
        //   imageSet.birdPredicates = Array.from(birdPredicates);
        // }
        await imageSet.save();
        // clean up uploaded files
        for (const file of uploadedFiles) {
          fs.unlinkSync(file.path);
        }
        for (const file of uploadedTestFiles) {
          fs.unlinkSync(file.path);
        }
      });
    });

    res.status(200).send({ message: "success" });
    return;
  } catch (err) {
    res.status(500).send(new ErrorResponse(0, "Failed to upload images", err));
    return;
  }

});

router.post(getPath('/deleteImageSet'), async (req, res) => {
  try {
    const imgSetName = req.body.name;
    const imageIds = await ImageSet.findOne({ name: imgSetName }).lean();
    if (!imageIds) {
      res.status(404).send(new ErrorResponse(-1, "Image set not found"));
      return;
    }
    await Image.deleteMany({ _id: { $in: imageIds.images } });
    await ImageSet.deleteOne({ name: imgSetName });
    res.status(200).send({ message: "success" });
  } catch (err) {
    res.status(500).send(new ErrorResponse(0, "Failed to delete image set", err));
    return;
  }
});

router.post(getPath('/purgeImage'), async (req, res) => {
  if (!req.body) {
    try {
      const { dataset, markedImgs } = req.body;
      // find image set first
      const imgSet = await ImageSet.findOne({ name: dataset });
      // delete images in image set and database
      imgSet.images = imgSet.images.filter(id => !markedImgs.includes(id.toString()));
      await imgSet.save();
      await Image.deleteMany({ _id: { $in: markedImgs } });
    } catch (err) {
      res.status(500).send(new ErrorResponse(0, "Failed to delete images", err));
      return;
    }
  } else {
    res.status(400).send(new ErrorResponse(2, "Request body is missing"));
    return;
  }
});


module.exports = { router }