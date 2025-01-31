const { mongoose } = require('../../mongoose');

const ImageLabelSchema = new mongoose.Schema({
  name: { // label(s)
    type: [String],
    required: true,
  },
  confirmed: {
    type: Boolean
  },
  canvasId: {
    type: String,
  },
  mark: { // segmentation target information, see Typescript definition for more details
    type: mongoose.Schema.Types.Mixed,
  }
}, { _id: false });

const ImageMetaDataSchema = new mongoose.Schema({
  imageId: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  labels: [ImageLabelSchema],
  attributes: {
    type: mongoose.Schema.Types.Mixed,
  },
  name: {
    type: String,
    required: true,
    default: "image",
  },
  labeled: {
    type: Boolean,
    required: true,
    default: false,
  },
  manual: {
    type: Boolean,
    required: true,
    default: false,
  },
  trueLabel: {
    type: String,
    required: true,
    default: "none",
  },
}, { _id: false });

const StatisticsSchema = new mongoose.Schema({
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  unlabeled: {
    type: Number,
    required: true,
    default: 0,
  },
  manual: {
    type: Number,
    required: true,
    default: 0,
  },
  autoLabeled: {
    type: Number,
    required: true,
    default: 0,
  },
  accuracy: {
    type: Number,
    required: true,
    default: 0,
  },
  label_coverage: {
    type: mongoose.Schema.Types.Mixed,
  }
}, { _id: false });

const LiteralSchema = new mongoose.Schema({
  type: {
    type: String,
    required: false,
  },
  literal: {
    type: String,
    required: true,
  },
  naturalValue: {
    type: String,
    default: "",
  },
  locked: {
    type: Boolean,
    default: false,
  },
  deleted: {
    type: Boolean,
    default: false,
  }
}, { _id: false });

const ClauseSchema = new mongoose.Schema({
  literals: {
    type: [LiteralSchema],
    default: [],
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  locked: {
    type: Boolean,
    default: false,
  }
});

const RuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  clauses: {
    type: [ClauseSchema], // array of clauses
    default: []
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  locked: {
    type: Boolean,
    default: false,
  }
});

const RestrictionSchema = new mongoose.Schema({
  deleted: {
    type: mongoose.Schema.Types.Mixed,
  },
  locked: {
    type: mongoose.Schema.Types.Mixed,
  }
}, { _id: false });

const ImageCollectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    required: true,
    default: "Classification",
  },
  images: [ImageMetaDataSchema],
  imageOrder: {
    type: [mongoose.Schema.Types.ObjectId],
  },
  al_imageOrder: {
    type: [mongoose.Schema.Types.ObjectId],
  },
  statistics: StatisticsSchema,
  rules: [RuleSchema],
  labelOptions: {
    type: [String],
  },
  test: [mongoose.Schema.Types.ObjectId],
  tfidf: {
    type: mongoose.Schema.Types.Mixed,
  },
  num_object_list: [String],
  area_object_list: [String],
  restrictions: {
    type: RestrictionSchema
  },
  type: {
    type: String,
  },
  birdPredicates: {
    type: mongoose.Schema.Types.Mixed,
  }
});

const WorkspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  collections: [ImageCollectionSchema],
  logs: {
    type: [mongoose.Schema.Types.Mixed],
  },
});

const Workspace = mongoose.model('Workspace', WorkspaceSchema);

module.exports = {
  Workspace,
  ImageCollectionSchema,
  ImageLabelSchema,
  WorkspaceSchema,
  ImageMetaDataSchema,
  LiteralSchema,
  ClauseSchema,
  RestrictionSchema,
  StatisticsSchema,
}