def strip(lit):
    # Strip a literal into only before (
    # If is N, return the initial one
    # If is N
    # print(lit)
    if lit == 'none':
        return lit
    if lit[:2] == 'N<' or lit[:2] == 'N>' or lit[:2] == 'S<' or lit[:2] == 'S>':
        return lit

    return lit[:lit.index('(')]


def find_obj(clause, chr):
    # Find the corresponding object of character in the clause
    for lite in clause:
        if strip(lite) not in ['overlap', 'area', 'color', 'num'] and lite[:2] not in ['N<', 'N>', 'S<', 'S>']:
            if lite[-2] == chr:
                return strip(lite)
    return None


def form_clause(db_clause):
    # Form a unstrip clause from database
    lit_lst = []
    for db_lit in db_clause['literals']:
        lit_lst.append(db_lit['literal'])
    return lit_lst


def compare_tuple(str1, str2):
    # Compare (A,B) with (C,D)
    if str1[:str1.index(',')] == str2[:str2.index(',')] and str1[str1.index(',') + 1:] == str2[str2.index(',') + 1:]:
        return True
    elif str1[:str1.index(',')] == str2[str2.index(',') + 1:] and str1[str1.index(',') + 1:] == str2[:str2.index(',')]:
        return True
    else:
        return False


def is_equal_cl(created_cl, db_cl):
    # Determine whether two clause is equal
    # The created_cl is the clause cl in updating restrictions, which is a stripped clause
    # The db_cl is the clause saving in Database restrictions, which is a stripped clause
    in_ac = 0
    for strip_lit in created_cl:
        for db_strip_lit in db_cl:
            if strip_lit[:8] == 'overlap(':
                if db_strip_lit[:8] == 'overlap(' and compare_tuple(
                        strip_lit[strip_lit.index('(') + 1:strip_lit.index(')')],
                        db_strip_lit[db_strip_lit.index('(') + 1:db_strip_lit.index(')')]):
                    in_ac += 1
            elif strip_lit == db_strip_lit:
                in_ac += 1
            # Add cases for num, N, and area
    return in_ac == len(created_cl)


def strip_lit(intial_cl, liter):
    # print(liter)
    if strip(liter) == 'overlap':
        appd_lit = 'overlap({},{})'.format(find_obj(intial_cl, liter[-2]),
                                           find_obj(intial_cl, liter[-4]))
    # change lock saving
    elif strip(liter) in ['num', 'area', 'color']:
        appd_lit = '{}({},{})'.format(strip(liter),
                                      find_obj(intial_cl, liter[liter.index('(') + 1:liter.index(',')]),
                                      liter[liter.index(',') + 1:liter.index(')')])
    else:
        appd_lit = strip(liter)
    return appd_lit


def strip_cl(lst):
    # Strip a clause
    # example:
    res_cl = []
    for litl in lst:
        res_cl.append(strip_lit(lst, litl))
    return res_cl


def lit_in(unstrip_lit, unstrip_clause, strip_clause):
    # Check whether the unstripped literal is in the strip clause for updating lock
    # unstrip_clause is used for object find
    strip_lit = strip(unstrip_lit)
    if strip_lit == 'overlap':
        compare_lit1 = 'overlap({},{})'.format(find_obj(unstrip_clause, unstrip_lit[-2]),
                                               find_obj(unstrip_clause, unstrip_lit[-4]))
        compare_lit2 = 'overlap({},{})'.format(find_obj(unstrip_clause, unstrip_lit[-4]),
                                               find_obj(unstrip_clause, unstrip_lit[-2]))
        if compare_lit1 in strip_clause or compare_lit2 in strip_clause:
            return True
    if strip_lit in ['num', 'area', 'color']:
        compare_lit = '{}({},{})'.format(strip_lit, find_obj(unstrip_clause, unstrip_lit[unstrip_lit.index(
            '(') + 1:unstrip_lit.index(',')]), unstrip_lit[unstrip_lit.index(',') + 1:unstrip_lit.index(')')])
        if compare_lit in strip_clause:
            return True
    elif strip_lit in strip_clause:
        return True
    else:
        return False