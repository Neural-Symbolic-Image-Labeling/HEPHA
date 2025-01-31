import * as Blockly from "blockly";

export const ruleGenerator = new Blockly.Generator("RULE");
ruleGenerator.PRECEDENCE = 0;

class LiteralSchema {
  constructor(type, codeValue, naturalValue) {
    this.type = type;
    this.literal = codeValue;
    this.naturalValue = naturalValue;
    this.deleted = false;
    this.locked = false;
  }
}

class ClauseSchema {
  constructor(literals, deleted, locked) {
    this.literals = literals;
    this.deleted = deleted;
    this.locked = locked;
  }
}

class RuleSchema {
  constructor(name, clauses, locked) {
    this.name = name;
    this.clauses = clauses;
    this.deleted = false;
    this.locked = locked;
  }
}

// Helpers

/**
 * get all the direct children of a block in order(a fix? for the built-in function getChildren()).
 * Here, direct children means the children that are directly nested inside the block. All indiredtedly nested blocks are excluded.
 * @param {Blockly.Block} block root block
 * @param {string} fieldName field name of the input. Used to located which input to get children from
 */
const getDirectChildren = (block, fieldName) => {
  const directChildren = [];
  let child = block.getInput(fieldName).connection.targetBlock();
  while (child) {
    directChildren.push(child);
    child = child.nextConnection.targetBlock();
  }
  return directChildren;
};

// Code Definitions

const appendRuleGenerator = (ruleName, callback) => {
  ruleGenerator.forBlock[ruleName] = callback;
};

export const setBirdRuleGenerator = (birdPredicates) => {
  for (let predicate of Object.keys(birdPredicates)) {
    const fullPredicate = `bird_${predicate}`;
    appendRuleGenerator(fullPredicate, function (block) {
      const literal = new LiteralSchema(
        predicate,
        `${predicate}(X,${block.getFieldValue("DROPDOWN")})`,
        `${predicate}+${block.getFieldValue("DROPDOWN")}`
      );
      return JSON.stringify(literal);
    });
  }
};

/**
 * define code for rule block
 *  @param {Blockly.Block} block
 */
ruleGenerator.forBlock["rule"] = function (block) {
  const clauseList = [];
  const clauses = getDirectChildren(block, "CLAUSES");
  for (let child of clauses) {
    const child_code = JSON.parse(ruleGenerator.blockToCode(child));
    if (Array.isArray(child_code)) {
      clauseList.push(...child_code);
    } else {
      clauseList.push(child_code);
    }
  }
  const rule = new RuleSchema(block.getFieldValue("NAME"), clauseList, false);
  return JSON.stringify(rule);
};

/**
 * define code for clause block
 * @param {Blockly.Block} block
 * @returns {string[]}
 */
ruleGenerator.forBlock["clause"] = function (block) {
  const literalList = [];
  // only consider the children on the next inner level
  const directChildren = getDirectChildren(block, "LITERALS");
  //   .filter(function (descendantBlock) {
  //   return descendantBlock.type !== 'clause' && descendantBlock.getParent()?.type === 'clause';
  // });
  // alert("directChildren: " + directChildren.length);
  for (let child of directChildren) {
    // alert("child: " + child.type)
    if (child.type === "clause" && child.id !== block.id) {
      break;
    }
    if (child.type !== "clause") {
      const child_code = JSON.parse(ruleGenerator.blockToCode(child));
      if (Array.isArray(child_code)) {
        literalList.push(...child_code);
      } else {
        literalList.push(JSON.parse(ruleGenerator.blockToCode(child)));
      }
    }
  }
  const locked = block.getFieldValue("LOCKED");
  const deleted = block.getFieldValue("BANNED");
  const clause = new ClauseSchema(
    literalList,
    deleted === "TRUE" || deleted === true,
    locked === "TRUE" || locked === true
  );

  return JSON.stringify(clause);
};

/**
 * define code for overlap block
 * @param {Blockly.Block} block
 * @returns
 */
ruleGenerator.forBlock["overlap"] = function (block) {
  const obj1 = block.getFieldValue("OBJ1");
  const obj2 = block.getFieldValue("OBJ2");
  const literal = new LiteralSchema(
    "OVERLAP",
    `overlap(${obj1},${obj2})`,
    `${obj1} overlaps with ${obj2}`
  );
  return JSON.stringify(literal);
};

/**
 * define code for has block
 * @param {Blockly.Block} block
 * @returns
 */
ruleGenerator.forBlock["has"] = function (block) {
  const obj = block.getFieldValue("OBJECT");
  const literal = new LiteralSchema("HAS", `${obj}`, `${obj} exists`);
  // console.log(literal);
  return JSON.stringify(literal);
};

/**
 * define code for has_num block
 * @param {Blockly.Block} block
 * @returns
 */
ruleGenerator.forBlock["has_num"] = function (block) {
  const obj = block.getFieldValue("OBJECT");
  const num = block.getFieldValue("NUM") * 1;
  const operator = block.getFieldValue("OPERATOR");
  const literal = new LiteralSchema(
    "HAS_NUM",
    `${obj}`,
    `${obj} exists and occurs ${operator} ${num} times.`
  );
  const numliteral = new LiteralSchema(
    "NUM",
    `num(${obj},N)`,
    `occurs ${num} times.`
  );
  const Nliteral = new LiteralSchema(
    "N",
    `N${operator}${num}`,
    `${operator} ${num}`
  );
  // console.log(literal);
  return JSON.stringify([literal, numliteral, Nliteral]);
};

/**
 * define code for has_area block
 * @param {Blockly.Block} block
 * @returns
 */
ruleGenerator.forBlock["has_area"] = function (block) {
  const obj = block.getFieldValue("OBJECT");
  const area = block.getFieldValue("AREA") * 1;
  const operator = block.getFieldValue("OPERATOR");
  const literal = new LiteralSchema(
    "HAS_AREA",
    `${obj}`,
    `${obj} exists with area ${operator} ${area}`
  );
  const arealiteral = new LiteralSchema(
    "AREA",
    `area(${obj},N)`,
    `area ${operator} ${area}`
  );
  const Nliteral = new LiteralSchema(
    "N",
    `N${operator}${area}`,
    `${operator} ${area}`
  );
  // console.log(literal);
  return JSON.stringify([literal, arealiteral, Nliteral]);
};

/**
 * define code for not block
 * @param {Blockly.Block} block
 */
ruleGenerator.forBlock["not"] = function (block) {
  // find inner block
  const inner_block = getDirectChildren(block, "PRED")[0];
  const inner_blk_type = inner_block.type;
  const inner_json = JSON.parse(ruleGenerator.blockToCode(inner_block));
  if (inner_blk_type === "has") {
    inner_json.literal = `¬${inner_json.literal}`;
    inner_json.naturalValue = `not ${inner_json.naturalValue}`;
  } else if (inner_blk_type === "has_num" || inner_blk_type === "has_area") {
    inner_json[0].literal = `¬${inner_json[0].literal}`;
    inner_json[0].naturalValue = `not ${inner_json[0].naturalValue}`;
  } else {
    inner_json.literal = `¬${inner_json.literal}`;
    inner_json.naturalValue = `not ${inner_json.naturalValue}`;
  }

  return JSON.stringify(inner_json);
};

/**
 * define code for medical ACDR block
 * @param {Blockly.Block} block
 */
ruleGenerator.forBlock["medical_acdr"] = function (block) {
  const literal = new LiteralSchema("MEDICAL_ACDR", `ACDR`, `ACDR`);
  const areaLiteral = new LiteralSchema("AREA", `area(ACDR,N)`, `area`);
  const tresholdLiteral = new LiteralSchema(
    `THRESHOLD`,
    `threshold(N,${block.getFieldValue("MIN")},${block.getFieldValue("MAX")})`,
    `THRESHOLD`
  );
  return JSON.stringify([literal, areaLiteral, tresholdLiteral]);
};

/**
 * define code for medical HCDR block
 * @param {Blockly.Block} block
 */
ruleGenerator.forBlock["medical_hcdr"] = function (block) {
  const literal = new LiteralSchema("MEDICAL_HCDR", `HCDR`, `HCDR`);
  const areaLiteral = new LiteralSchema("AREA", `area(HCDR, N)`, `area`);
  const tresholdLiteral = new LiteralSchema(
    `THRESHOLD`,
    `threshold(N,${block.getFieldValue("MIN")},${block.getFieldValue("MAX")})`,
    `THRESHOLD`
  );
  return JSON.stringify([literal, areaLiteral, tresholdLiteral]);
};

/**
 * define code for medical VCDR block
 * @param {Blockly.Block} block
 */
ruleGenerator.forBlock["medical_vcdr"] = function (block) {
  const literal = new LiteralSchema("MEDICAL_VCDR", `VCDR`, `VCDR`);
  const areaLiteral = new LiteralSchema("AREA", `area(VCDR, N)`, `area`);
  const tresholdLiteral = new LiteralSchema(
    `THRESHOLD`,
    `threshold(N,${block.getFieldValue("MIN")},${block.getFieldValue("MAX")})`,
    `THRESHOLD`
  );
  return JSON.stringify([literal, areaLiteral, tresholdLiteral]);
};
