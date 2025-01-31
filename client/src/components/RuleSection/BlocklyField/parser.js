import Predicate from "./Predicate";

export const rule_parser = (rule, inde, y) => {
  // const rule = "Driver: {0%[has(X, A, <, -1, >, -1), overlap(A, B), overlap(A, B), overlap(A, B)], 1_[overlap(A, B)]}"
  var rule_name = rule.split(":")[0];
  var clauses = rule.split(":")[1];

  var out = {
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: "rule",
          x: 0,
          y: y,
          editable: false,
          deletable: false,
          fields: {
            NAME: rule_name,
          },
          inputs: { CLAUSES: {} },
        },
      ],
    },
  };

  if (clauses.indexOf("]") !== -1) {
    clauses = clauses.split("],");
    clauses.forEach((clause) => {
      var lock = clause.split("%")[0].replace("{", "").trim();
      clause = clause
        .split("%")[1]
        .replace("[", "")
        .replace("]", "")
        .replace("{", "")
        .replace("}", "")
        .trim();
      if (
        out["blocks"]["blocks"][0]["inputs"]["CLAUSES"]["block"] === undefined
      ) {
        out["blocks"]["blocks"][0]["inputs"]["CLAUSES"]["block"] = {
          type: "clause",
          fields: {
            LOCKED: lock === "1" ? true : false,
          },
          inputs: {},
        };
        var literals = clause.split("), ");
        var head = undefined;
        literals.forEach((literal) => {
          var block = literal_parser(literal);
          if (head === undefined) {
            head = block;
          } else {
            var temp = head;
            while (temp["block"]["next"] !== undefined) {
              temp = temp["block"]["next"];
            }
            temp["block"]["next"] = block;
          }
        });
        out["blocks"]["blocks"][0]["inputs"]["CLAUSES"]["block"]["inputs"][
          "LITERALS"
        ] = head;
      } else {
        var clause_head =
          out["blocks"]["blocks"][0]["inputs"]["CLAUSES"]["block"];
        while (clause_head["next"] !== undefined) {
          clause_head = clause_head["next"];
          if (clause_head["block"] !== undefined) {
            clause_head = clause_head["block"];
          }
        }
        clause_head["next"] = {
          block: {
            type: "clause",
            fields: {
              LOCKED: lock === "1" ? true : false,
            },
            inputs: {},
          },
        };
        literals = clause.split("), ");
        head = undefined;
        literals.forEach((literal) => {
          var block = literal_parser(literal);
          if (head === undefined) {
            head = block;
          } else {
            var temp = head;
            while (temp["block"]["next"] !== undefined) {
              temp = temp["block"]["next"];
            }
            temp["block"]["next"] = block;
          }
        });
        clause_head["next"]["block"]["inputs"]["LITERALS"] = head;
      }
    });
  }

  if (inde !== 0) {
    return JSON.stringify(out["blocks"]["blocks"][0]);
  }

  return JSON.stringify(out);
};

const literal_parser = (literal) => {
  var name = literal.split("(")[0].replace(",", "").trim();
  // console.log(name)
  var values = literal.split("(")[1].replace(")", "").split(", ");
  // alert(literal);
  // alert(name + " " + values);
  return new Predicate(name, ...values).get_block();
};
