const { Image } = require('../../models/Image');

const router = require('express').Router();

router.post("/test/inter", async (req, res) => {
  const imgDoc = await Image.findOne({ _id: req.body.id });
  imgDoc.interpretation = {
    objects: [
      {
        name: "person",
        confidence: 0.9,
        coordinates: [1.03, 1.03, 1.03, 1.03]
      },
      {
        name: "person",
        confidence: 0.9,
        coordinates: [1.03, 1.03, 1.03, 1.03]
      }
    ],
    overlaps: [
      {
        objA: "0",
        objB: "1",
        IOU: "0.4"
      }
    ]
  };
  await imgDoc.save();
  res.status(200).send(imgDoc);
});

module.exports = { router };