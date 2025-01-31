const { mongoose } = require('../../mongoose');

const ImageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  attributes: {
    type: mongoose.Schema.Types.Mixed,
  },
  data: {
    type: String,
    required: true,
  },
  interpretation: {
    type: mongoose.Schema.Types.Mixed,
  },
  label: {
    type: String,
  },
  mask: {
    type: mongoose.Schema.Types.Mixed,
  },
});

const ImageSetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  images: [mongoose.Types.ObjectId],
  test: [mongoose.Types.ObjectId],
  testLabelOptions: {
    type: [String],
  },
  labelOptions: {
    type: [String],
  },
  type: {
    type: String,
    enum: ['Medical', 'Bird', 'Default'],
    default: 'Default',
  },
  tfidf: {
    type: mongoose.Schema.Types.Mixed,
  },
});

const Image = mongoose.model('Image', ImageSchema);
const ImageSet = mongoose.model('ImageSet', ImageSetSchema);

module.exports = {
  ImageSchema,
  ImageSetSchema,
  ImageSet,
  Image
};