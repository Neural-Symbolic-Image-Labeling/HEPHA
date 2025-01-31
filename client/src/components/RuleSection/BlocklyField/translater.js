const cha_to_num = (target, object_list, lists) => {
  if (!object_list) object_list = [1, 2, 3];
  const c = target.split(/[(|,|)]/);
  const new_dict = {};
  const rule_list = [];
  // alert("lists[c[0]]:" + JSON.stringify(lists[c[0]]))
  for (let old_clause of lists[c[0]]) {
    // alert("old_clause: "+ JSON.stringify(old_clause))
    if (old_clause.length === 0) {
      rule_list.push(old_clause);
    }

    const new_clause = [];
    for (let pos = 0; pos < old_clause.length; pos++) {
      const predicate = old_clause[pos];
      // const a = predicate.split(/[¬|(|,|)]/);
      // alert(predicate)

      // has_
      if (/^(¬?)has_(.*)$/.test(predicate)) {
        new_clause.push(predicate);
      }
      // XCDR
      else if (/^(ACDR|HCDR|VCDR)$/.test(predicate)) {
        new_clause.push(
          `${predicate}(X,${object_list.indexOf(predicate).toString()})`,
        );
      }
      // area
      else if (/^area\((.+),N\)$/.test(predicate)) {
        const match = /^area\((.+),N\)$/.exec(predicate);
        new_clause.push(`area(${object_list.indexOf(match[1]).toString()},N)`);
      }
      // treshold
      else if (/^threshold\(N,(.+),(.+)\)$/.test(predicate)) {
        new_clause.push(predicate);
      }
      // N <|> num
      else if (/^N[>|<](.+)$/.test(predicate)) {
        new_clause.push(predicate);
      }
      // num
      else if (/^num\((.+),N\)$/.test(predicate)) {
        const match = /^num\((.+),N\)$/.exec(predicate);
        new_clause.push(`area(${object_list.indexOf(match[1]).toString()},N)`);
      } else if (/^overlap\((.+),(.+)\)$/.test(predicate)) {
        const match = /^overlap\((.+),(.+)\)$/.exec(predicate);
        new_clause.push(
          `overlap(${object_list.indexOf(match[1]).toString()},${object_list.indexOf(match[2]).toString()})`,
        );
      }
      //has
      else {
        new_clause.push(
          `${predicate}(X,${object_list.indexOf(predicate).toString()})`,
        );
      }
    }
    rule_list.push(new_clause);
    new_dict[c[0]] = rule_list;
  }
  return new_dict;
};

export const translateRules = (rules, object_list) => {
  const rules_copy = JSON.parse(JSON.stringify(rules));

  const newRuleDict = {};
  for (let rule of rules) {
    let curr_rule = [];
    for (let clause of rule.clauses) {
      let curr_clause = [];
      for (let literal of clause.literals) {
        // console.log("literal: ", literal);
        curr_clause.push(literal.literal);
      }
      curr_rule.push(curr_clause);
    }
    newRuleDict[rule.name] = curr_rule;
  }
  // console.log("new rule dict: ", newRuleDict);

  const results = {};
  for (let label in newRuleDict) {
    if (label === "normal") label = "ndrishti";
    else if (label === "abnormal") label = "gdrishti";

    if (newRuleDict[label].length === 0) {
      // newRuleDict[label] = [[]];
      // console.log(label + ' ' + JSON.stringify(rule[label]))
      results[label + "(" + "X" + ")"] = [[]];
      continue;
    }

    const rule_target = cha_to_num(label, object_list, newRuleDict);
    const new_key = label + "(" + "X" + ")";
    results[new_key] = rule_target[label];
    // alert(JSON.stringify(results))
  }
  console.log("results", results);

  let clause_idx = 0;
  let literal_idx = 0;
  for (const rule of rules_copy) {
    // console.log("rule: ", rule);
    clause_idx = 0;
    for (const clause of rule.clauses) {
      literal_idx = 0;
      for (const literal of clause.literals) {
        const new_literal = results[`${rule.name}(X)`][clause_idx][literal_idx];
        literal.literal = new_literal;
        literal_idx++;
      }
      clause_idx++;
    }
  }

  // console.log(JSON.stringify(rules_copy));
  return rules_copy;
};
