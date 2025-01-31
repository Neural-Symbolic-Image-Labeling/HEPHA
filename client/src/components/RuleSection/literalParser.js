const regexDict = {
  hasLiteral: {
    math: /^([a-zA-Z]+)\(X,(.+)\)$/,
    natural: /^This image has (.+)$/,
  },
  overLapLiteralRegex: {
    math: /^overlap\(([^NX]+),([^NX]+)\)$/,
    natural: /^([a-zA-Z]+) is overlaped with ([a-zA-Z]+)$/,
  },
};

const literalHandlers = {
  hasLiteral: {
    handler: (naturalValue, objectList, clause, indexL) => {
      // console.log("current target literal: " + `${clause.literals[indexL].literal}`);
      try {
        if (!new RegExp(regexDict.hasLiteral.natural).test(naturalValue))
          return null;
        // New literal is a hasLiteral
        // extract object and generate new math value
        const inputObject = naturalValue.match(regexDict.hasLiteral.natural)[1];
        //generate new math value
        const newMathValue = `${inputObject}(X,-1)`;
        //replace math value
        clause.literals[indexL].literal = newMathValue;
        // console.log("new literal: " + `${clause.literals[indexL].literal}`);
        let result = clauseParser(objectList, clause, indexL);
        return result;
      } catch (error) {
        return null;
      }
    },
  },
  // Temporary solution for overlapping literals
  overLapLiteralRegex: {
    handler: (naturalValue, objectList, clause, indexL, r) => {
      try {
        if (
          !new RegExp(regexDict.overLapLiteralRegex.natural).test(naturalValue)
        )
          return null;
        // New literal is a overLapLiteral
        // extract object names and search all hasLiterals for their letter forms
        const matches = naturalValue.match(
          regexDict.overLapLiteralRegex.natural,
        );
        const o1Name = matches[1];
        const o2Name = matches[2];
        let o1Letter = null;
        let o2Letter = null;
        for (let l of clause.literals) {
          if (l.deleted) continue;
          if (new RegExp(regexDict.hasLiteral.math).test(l.literal)) {
            // this literal is a hasLiteral
            let lmatches = l.literal.match(regexDict.hasLiteral.math);
            if (lmatches[1].toUpperCase() === o1Name.toUpperCase()) {
              o1Letter = lmatches[2];
            }
            if (lmatches[1].toUpperCase() === o2Name.toUpperCase()) {
              o2Letter = lmatches[2];
            }
          }
        }
        if (!o1Letter || !o2Letter) return null;
        // generate new math value
        const newMathValue = `overlap(${o1Letter},${o2Letter})`;
        // replace math value
        clause.literals[indexL].literal = newMathValue;
        // console.log("new math value: " + `${clause.literals[indexL].literal}`);

        // console.log("after generate overlap math value: ", clause)
        return clause;
      } catch (error) {
        return null;
      }
    },
  },
};

export const parseLiteral = (naturalValue, objectList, clause, indexL) => {
  for (let [key, value] of Object.entries(literalHandlers)) {
    // console.log("Now detecting pattern: ", key);
    let resultClause = value.handler(naturalValue, objectList, clause, indexL);
    if (resultClause) {
      return resultClause;
    }
  }
  return null;
};

const clauseParser = (objectList, clause, indexL) => {
  // console.log("Before parsing clause: ", clause);
  /**1. convert letters variables to numbers */
  //(for overlapLiteral)
  for (let index = 0; index < clause.literals.length; index++) {
    let literal = clause.literals[index];
    if (literal.deleted) continue;
    if (new RegExp(regexDict.overLapLiteralRegex.math).test(literal.literal)) {
      // this literal is an overLapLiteral
      // find names of object1 and object2
      let letterMatches = literal.literal.match(
        regexDict.overLapLiteralRegex.math,
      );
      let o1Letter = letterMatches[1];
      let o2Letter = letterMatches[2];
      let o1Name = null;
      let o2Name = null;
      for (let literal of clause.literals) {
        if (literal.deleted) continue;
        if (new RegExp(regexDict.hasLiteral.math).test(literal.literal)) {
          let matches = literal.literal.match(regexDict.hasLiteral.math);
          if (matches[2].toUpperCase() === o1Letter.toUpperCase()) {
            o1Name = matches[1];
          }
          if (matches[2].toUpperCase() === o2Letter.toUpperCase()) {
            o2Name = matches[1];
          }
        }
      }
      if (o1Name === null || o2Name === null) {
        return null;
      }
      //find indeces of objects
      let o1Index = objectList.findIndex(
        (object) => object.toUpperCase() === o1Name.toUpperCase(),
      );
      let o2Index = objectList.findIndex(
        (object) => object.toUpperCase() === o2Name.toUpperCase(),
      );
      if (o1Index === -1 || o2Index === -1) {
        return null;
      }
      //generate new math value
      let newLiteral = `overlap(${o1Index},${o2Index})`;
      literal.literal = newLiteral;
    }
  }
  // console.log("After converting overlapLiteral: ", clause);
  //(for numLiteral)
  for (let index = 0; index < clause.literals.length; index++) {
    let literal = clause.literals[index];
    if (literal.deleted) continue;
    //TODO
  }
  //(for hasLiteral, last one to process)
  for (let index = 0; index < clause.literals.length; index++) {
    let literal = clause.literals[index];
    if (literal.deleted) continue;
    if (new RegExp(regexDict.hasLiteral.math).test(literal.literal)) {
      // this literal is a hasLiteral
      // replace letter with object index
      let matches = literal.literal.match(regexDict.hasLiteral.math);
      let objectName = matches[1];
      let objectIndex = objectList.findIndex(
        (object) => object.toUpperCase() === matches[1].toUpperCase(),
      );
      if (objectIndex === -1) {
        return null;
      }
      let newLiteral = `${objectName}(X,${objectIndex})`;
      literal.literal = newLiteral;
    }
  }
  // console.log("After converting hasLiteral: ", clause);

  /**2. replace indeces back to letters */
  const letters = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "Y",
    "Z",
  ];
  let nextLetterIndex = 0;
  let currMatchTable = {};
  for (let index = 0; index < clause.literals.length; index++) {
    let literal = clause.literals[index];
    if (literal.deleted) continue;
    //(for hasLiteral)
    if (new RegExp(regexDict.hasLiteral.math).test(literal.literal)) {
      // this literal is a hasLiteral
      // find or add matching in table
      let matches = literal.literal.match(regexDict.hasLiteral.math);
      // console.log("find hasLiteral: ", literal);
      let objectName = matches[1];
      let targetIndex = Number.parseInt(matches[2]);
      // console.log("objectName: " + objectName, "targetIndex: " + targetIndex);
      if (!currMatchTable[targetIndex]) {
        // index has not been converted yet
        currMatchTable[targetIndex] = letters[nextLetterIndex];
        nextLetterIndex++;
      }
      let newLiteral = `${objectName}(X,${currMatchTable[targetIndex]})`;
      literal.literal = newLiteral;
      // console.log("updated literal: ", literal.literal);
    }
    //(for overlapLiteral)
    else if (
      new RegExp(regexDict.overLapLiteralRegex.math).test(literal.literal)
    ) {
      let matches = literal.literal.match(regexDict.overLapLiteralRegex.math);
      let o1Index = Number.parseInt(matches[1]);
      let o2Index = Number.parseInt(matches[2]);
      if (!currMatchTable[o1Index]) {
        currMatchTable[o1Index] = letters[nextLetterIndex];
        nextLetterIndex++;
      }
      if (!currMatchTable[o2Index]) {
        currMatchTable[o2Index] = letters[nextLetterIndex];
        nextLetterIndex++;
      }
      let newLiteral = `overlap(${currMatchTable[o1Index]},${currMatchTable[o2Index]})`;
      literal.literal = newLiteral;
    }
  }

  return clause;
};
