export default class Predicate {
  constructor(name, obj1, obj2, operator_num, num, operator_area, area, not) {
    this.name = name;
    this.obj1 = obj1;
    this.obj2 = obj2;
    this.num = num;
    this.operator_num = operator_num;
    this.area = area;
    this.operator_area = operator_area;
    this.not = not;
  }

  // Has(X, A, >, -1, >, -1, true)
  has(obj1, obj2, operator_num, num, operator_area, area, not) {
    if (not === "true") {
      return {
        block: {
          type: "not",
          inputs: {
            PRED: {
              block: {
                type: "has",
                fields: {
                  HAS_STRING: "Has",
                  OBJECT: obj2,
                },
              },
            },
          },
        },
      };
    }
    return {
      block: {
        type: "has",
        fields: {
          HAS_STRING: "Has",
          OBJECT: obj2,
        },
      },
    };
  }

  // Has_num(X, A, >, -1, >, -1, true)
  hasNum(obj1, obj2, operator_num, num, operator_area, area, not) {
    if (not === "true") {
      return {
        block: {
          type: "not",
          inputs: {
            PRED: {
              block: {
                type: "has_num",
                fields: {
                  OPERATOR: operator_num,
                  NUM: num,
                  OBJECT: obj2,
                  HAS_STRING: "Has",
                },
              },
            },
          },
        },
      };
    }

    return {
      block: {
        type: "has_num",
        fields: {
          OPERATOR: operator_num,
          NUM: num,
          OBJECT: obj2,
          HAS_STRING: "Has",
        },
      },
    };
  }

  // Has_area(X, A, >, -1, >, -1)
  hasArea(obj1, obj2, operator_num, num, operator_area, area, not) {
    if (not === "true") {
      return {
        block: {
          type: "not",
          inputs: {
            PRED: {
              block: {
                type: "has_area",
                fields: {
                  OBJECT: obj2,
                  OPERATOR: operator_area,
                  AREA: area,
                  HAS_STRING: "Has",
                },
              },
            },
          },
        },
      };
    }
    return {
      block: {
        type: "has_area",
        fields: {
          OBJECT: obj2,
          OPERATOR: operator_area,
          AREA: area,
          HAS_STRING: "Has",
        },
      },
    };
  }

  // Overlap(A, B)
  overlap(obj1, obj2, operator_num, num, operator_area, area, not) {
    return {
      block: {
        type: "overlap",
        fields: {
          obj1: obj1,
          obj2: obj2,
        },
      },
    };
  }

  // Bird(rule, name)
  bird(obj1, obj2, operator_num, num, operator_area, area, not) {
    if (not === "true") {
      return {
        block: {
          type: "not",
          inputs: {
            PRED: {
              block: {
                type: obj1,
                fields: { DROPDOWN: obj2 },
              },
            },
          },
        },
      };
    }
    return {
      block: {
        type: obj1,
        fields: { DROPDOWN: obj2 },
      },
    };
  }

  medical(obj1, obj2, operator_num, num, operator_area, area, not) {
    return {
      block: {
        type: obj1,
        fields: { MIN: obj2, MAX: operator_num },
      },
    };
  }

  get_block() {
    return this[this.name](
      this.obj1,
      this.obj2,
      this.operator_num,
      this.num,
      this.operator_area,
      this.area,
      this.not,
    );
  }
}
