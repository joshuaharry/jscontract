/*=====================================================================*/
/*    .../prgm/project/jscontract/workspaces/contract/contract.js      */
/*    -------------------------------------------------------------    */
/*    Author      :  manuel serrano                                    */
/*    Creation    :  Tue Feb 18 17:19:39 2020                          */
/*    Last change :  Tue Jun 29 17:36:35 2021 (serrano)                */
/*    Copyright   :  2020-21 manuel serrano                            */
/*    -------------------------------------------------------------    */
/*    Basic contract implementation                                    */
/*=====================================================================*/
"use strict";
"use hopscript";

/*---------------------------------------------------------------------*/
/*    ContractError                                                               */
/*---------------------------------------------------------------------*/
class ContractError extends TypeError {}

/*---------------------------------------------------------------------*/
/*    CT                                                               */
/*---------------------------------------------------------------------*/
class CT {
  constructor(name, firstOrder, wrapper) {
    this.cache = {};
    this.name = name;
    this.firstOrder = firstOrder;
    if (wrapper.length != 1)
      throw new ContractError(
        " CT's wrapper argument should accept only one argument: " + wrapper
      );
    this.wrapper = wrapper;
  }

  wrap(value, locationt = "pos", locationf = "neg") {
    const { t: tval, f: fval } = this.wrapper(
      new_blame_object(locationt, locationf)
    );
    return tval.ctor(value);
  }
}

/*---------------------------------------------------------------------*/
/*    toString ...                                                     */
/*---------------------------------------------------------------------*/
function toString(fields) {
  if (!fields || typeof fields !== "object") return `${fields}`;
  let res = "";
  let sep = "{";

  for (let n in fields) {
    res += sep + n;
    sep = ", ";
  }

  if (sep === "{") {
    return "{}";
  } else {
    return res + "}";
  }
}

/*---------------------------------------------------------------------*/
/*    CTwrapper ...                                                    */
/*---------------------------------------------------------------------*/
class CTWrapper {
  constructor(ctor) {
    this.ctor = ctor;
  }
}

/*---------------------------------------------------------------------*/
/*    CTFlat ...                                                       */
/*---------------------------------------------------------------------*/
function CTFlat(pred) {
  if (typeof pred !== "function") {
    throw new ContractError("Illegal predicate: " + pred);
  } else {
    function mkWrapper(blame_object) {
      return new CTWrapper(function (value) {
        if (pred(value)) {
          return value;
        } else {
          return signal_contract_violation(
            value,
            blame_object,
            "Predicate `" +
              predToString(pred) +
              "' not satisfied for value `" +
              value +
              "'"
          );
        }
      });
    }
    return new CT(pred.toString(), pred, function (blame_object) {
      return {
        t: mkWrapper(blame_object),
        f: mkWrapper(blame_swap(blame_object)),
      };
    });
  }
}

/*---------------------------------------------------------------------*/
/*    predToString ...                                                 */
/*---------------------------------------------------------------------*/
function predToString(pred) {
  if (pred === isString) {
    return "isString";
  } else if (pred === isBoolean) {
    return "isBoolean";
  } else if (pred === isNumber) {
    return "isNumber";
  } else if (pred === isObject) {
    return "isObject";
  } else if (pred === isError) {
    return "isError";
  } else {
    return pred.toString();
  }
}

/*---------------------------------------------------------------------*/
/*    fixArity ...                                                     */
/*---------------------------------------------------------------------*/
function fixArity(f) {
  return f.toString().match(/^[^(*]([^.]*)/);
}

/*---------------------------------------------------------------------*/
/*    CTFunction ...                                                   */
/*---------------------------------------------------------------------*/
function CTFunction(self, domain, range) {
  const arity = domain.length;
  let minarity = arity,
    maxarity = arity;

  if (!(domain instanceof Array)) {
    throw new ContractError("Illegal domain: " + domain);
  }

  const coerced_args = domain.map((p, index) => {
    if (typeof p === "object" && "contract" in p) {
      minarity -= 1;
      if (p.dotdotdot) maxarity = Number.MIN_SAFE_INTEGER;

      return {
        contract: CTCoerce(p.contract, "CTFunction, argument " + (index + 1)),
        dotdotdot: p.dotdotdot,
        optional: p.optional,
      };
    } else {
      return { contract: CTCoerce(p, "CTFunction, argument " + (index + 1)) };
    }
  });

  const coerced_si = CTCoerce(self, "CTFunction, self argument");
  const coerced_ri = CTCoerce(range, "CTFunction, range");

  function map2fix(args, domain, key) {
    let len = args.length;

    for (let i = 0; i < len; i++) {
      args[i] = domain[i][key].ctor(args[i]);
    }

    return args;
  }

  function map2opt(args, domain, key) {
    let len = args.length;

    for (let i = 0; i < domain.length; i++) {
      if (args[i] === undefined && coerced_args[i].optional === true) {
      } else {
        args[i] = domain[i][key].ctor(args[i]);
      }
    }
    for (let i = domain.length; i < args.length; i++) {
      args[i] = domain[domain.length - 1][key].ctor(args[i]);
    }

    return args;
  }

  function map2dotdotdot(args, domain, key) {
    let len = args.length;

    for (let i = 0; i < domain.length - 1; i++) {
      args[i] = domain[i][key].ctor(args[i]);
    }

    for (let i = domain.length; i < args.length; i++) {
      args[i] = domain[domain.length - 1][key].ctor(args[i]);
    }

    return args;
  }

  function firstOrder(x) {
    return typeof x === "function";
  }

  return new CT("CTFunction", firstOrder, function (blame_object) {
    function mkWrapper(blame_object, swap_blame_object, sik, rik, disk) {
      const si = coerced_si.wrapper(blame_object);
      const dis = coerced_args.map((d) => d.contract.wrapper(blame_object));
      const ri = coerced_ri.wrapper(blame_object);
      const si_wrapper = si[sik];
      const ri_wrapper = ri[rik];
      const di0_wrapper = coerced_args.length > 0 ? dis[0][disk] : undefined;
      const di1_wrapper = coerced_args.length > 1 ? dis[1][disk] : undefined;
      const handler = {
        apply: function (target, self, args) {
          if (args.length === arity)
            switch (args.length) {
              case 0:
                return ri_wrapper.ctor(
                  target.call(si_wrapper.ctor(self), undefined)
                );
              case 1:
                return ri_wrapper.ctor(
                  target.call(si_wrapper.ctor(self), di0_wrapper.ctor(args[0]))
                );
              case 2:
                return ri_wrapper.ctor(
                  target.call(
                    si_wrapper.ctor(self),
                    di0_wrapper.ctor(args[0]),
                    di1_wrapper.ctor(args[1])
                  )
                );
              default:
                return ri_wrapper.ctor(
                  target.apply(si_wrapper.ctor(self), map2fix(args, dis, disk))
                );
            }
          else if (args.length >= minarity && args.length <= maxarity) {
            return ri_wrapper.ctor(
              target.apply(si_wrapper.ctor(self), map2opt(args, dis, disk))
            );
          } else if (
            args.length >= minarity &&
            maxarity === Number.MIN_SAFE_INTEGER
          ) {
            return ri_wrapper.ctor(
              target.apply(
                si_wrapper.ctor(self),
                map2dotdotdot(args, dis, disk)
              )
            );
          } else {
            return signal_contract_violation(
              target,
              swap_blame_object,
              "Wrong argument count " + args.length + "/" + domain.length
            ).apply(self, args);
          }
        },
      };
      return new CTWrapper(function (value) {
        if (firstOrder(value)) {
          return new Proxy(value, handler);
        } else {
          return signal_contract_violation(
            value,
            blame_object,
            "Not a function `" + value + "': "
          );
        }
      });
    }

    return {
      t: mkWrapper(blame_object, blame_swap(blame_object), "t", "t", "f"),
      f: mkWrapper(blame_swap(blame_object), blame_object, "f", "f", "t"),
    };
  });
}

/*---------------------------------------------------------------------*/
/*    CTFunctionOpt ...                                                */
/*---------------------------------------------------------------------*/
function CTFunctionOpt(self, domain, range) {
  function map2opt(args, domain, key) {
    let len = args.length;

    for (let i = 0; i < domain.length; i++) {
      args[i] = domain[i][key].ctor(args[i]);
    }

    for (let i = domain.length; i < args.length; i++) {
      args[i] = domain[domain.length - 1][key].ctor(args[i]);
    }

    return args;
  }

  function firstOrder(x) {
    return typeof x === "function" && !fixArity(x);
  }

  if (!(domain instanceof Array)) {
    throw new ContractError("Illegal domain: " + domain);
  } else {
    const coerced_si = CTCoerce(self, "CTFunction, self argument");
    const coerced_dis = domain.map((d, index) =>
      CTCoerce(d, "CTFunction, argument " + (index + 1))
    );
    const coerced_ri = CTCoerce(range, "CTFunction, range ");

    return new CT("CTFunctionOpt", firstOrder, function (infot, infof) {
      const si = coerced_si.wrapper(infot, infof);
      const dis = coerced_dis.map((d) => d.wrapper(infot, infof));
      const ri = coerced_ri.wrapper(infot, infof);

      function mkWrapper(info, si, sik, ri, rik, dis, disk) {
        const si_wrapper = si[sik];
        const ri_wrapper = ri[rik];

        const handler = {
          apply: function (target, self, args) {
            if (args.length < domain.length) {
              throw new ContractError(
                "Wrong number of argument " +
                  args.length +
                  "/" +
                  domain.length +
                  ": " +
                  info
              );
            } else {
              return ri_wrapper.ctor(
                target.apply(si_wrapper.ctor(self), map2opt(args, dis, disk))
              );
            }
          },
        };
        return new CTWrapper(function (value) {
          if (firstOrder(value)) {
            return new Proxy(value, handler);
          } else {
            throw new ContractError("Not a function `" + value + "': " + info);
          }
        });
      }

      return {
        t: mkWrapper(infot, si, "t", ri, "t", dis, "f"),
        f: mkWrapper(infof, si, "f", ri, "f", dis, "t"),
      };
    });
  }
}

/*---------------------------------------------------------------------*/
/*    CTFunctionD ...                                                  */
/*---------------------------------------------------------------------*/
function CTFunctionD(domain, range, info_indy) {
  function firstOrder(x) {
    return typeof x === "function";
  }

  if (!(domain instanceof Array)) {
    throw new ContractError("Illegal domain: " + domain);
  }
  for (let i = 0; i < domain.length; i++) {
    if (!domain[i])
      throw new ContractError(
        "Illegal domain entry at index " + i + ": " + domain[i]
      );
    if (!domain[i].ctc)
      throw new ContractError(
        "Illegal domain entry at index " + i + ", no ctc field: " + domain[i]
      );
    if (!domain[i].name)
      throw new ContractError(
        "Illegal domain entry at index " + i + ", no name field: " + domain[i]
      );
  }
  const dep_order_to_arg_order = topsort(domain);
  const depended_on = find_depended_on(domain);

  const domain_ctcs = [];
  for (let i = 0; i < domain.length; i++) {
    const d = domain[i];
    if (!d.dep)
      domain_ctcs[i] = CTCoerce(d.ctc, "CTFunctionD, argument " + (i + 1));
  }
  const range_ctc = CTCoerce(range, "CTFunctionD, range");

  return new CT("CTFunctionD", firstOrder, function (blame_object) {
    function mkWrapper(blame_object, rik, disk) {
      const normal_dis = [];
      const dep_dis = [];
      for (let i = 0; i < domain.length; i++) {
        const d = domain[i];
        if (!d.dep) {
          normal_dis[i] = domain_ctcs[i].wrapper(blame_object);
          if (depended_on[i]) {
            dep_dis[i] = domain_ctcs[i].wrapper(blame_object);
          }
        }
      }
      const ri = range_ctc.wrapper(blame_object);
      const handler = {
        apply: function (target, self, args) {
          if (args.length !== domain.length) {
            return signal_contract_violation(
              target,
              blame_object,
              "Wrong number of argument " + args.length + "/" + domain.length
            );
          } else {
            var wrapped_args_for_dep = {}; // what happens if the dependent code modifies this thing?
            var wrapped_args = [];
            for (let dep_i = 0; dep_i < domain.length; dep_i++) {
              let arg_i = dep_order_to_arg_order[dep_i];
              if (domain[arg_i].dep) {
                if (depended_on[arg_i]) {
                  const ctc_for_dep = domain[arg_i].ctc(wrapped_args_for_dep);
                  const di_for_dep = CTDepApply(
                    ctc_for_dep,
                    blame_replace_neg(blame_object, info_indy),
                    "CTFunctionD"
                  );
                  wrapped_args_for_dep[domain[arg_i].name] = di_for_dep[
                    disk
                  ].ctor(args[arg_i]);
                }
                // wrapped_args_for_dep has one item too many in it
                // at this point; due to previous assignment
                const ctc = domain[arg_i].ctc(wrapped_args_for_dep);
                const di = CTDepApply(
                  ctc,
                  blame_replace_neg(blame_object, info_indy),
                  "CTFunctionD"
                );
                wrapped_args[arg_i] = di[disk].ctor(args[arg_i]);
              } else {
                if (depended_on[arg_i]) {
                  wrapped_args_for_dep[domain[arg_i].name] = dep_dis[arg_i][
                    disk
                  ].ctor(args[arg_i]);
                }
                wrapped_args[arg_i] = normal_dis[arg_i][disk].ctor(args[arg_i]);
              }
            }

            // skiped the post-condition contract (for now); it would be something like
            // ri[ rik ].ctor(<<result>>)
            // MS 30apr2021: I think it is incorrect not to apply any contract to self
            return target.apply(self, wrapped_args);
          }
        },
      };
      return new CTWrapper(function (value) {
        if (firstOrder(value)) {
          return new Proxy(value, handler);
        } else {
          return signal_contract_violation(
            value,
            blame_object,
            "Not a function `" + value
          );
        }
      });
    }

    return {
      t: mkWrapper(blame_object, "t", "f"),
      f: mkWrapper(blame_swap(blame_object), "f", "t"),
    };
  });
}

function CTDepApply(ctc, blame_object, who) {
  return CTCoerce(ctc, who).wrapper(blame_object);
}

function topsort(orig_domain) {
  const name_to_id = [];
  for (let i = 0; i < orig_domain.length; i++) {
    name_to_id[orig_domain[i].name] = i;
  }

  // make a copy of the input objects so we can modify
  // them (by adding the temporary and permanent marks)
  const domain = orig_domain.slice();
  for (let i = 0; i < domain.length; i++) {
    function cmp(x, y) {
      return name_to_id[x.name] < name_to_id[y.name];
    }
    domain[i] = {
      name: domain[i].name,
      dep: domain[i].dep ? domain[i].dep.slice().sort(cmp) : [],
      temporary_mark: false,
      permanent_mark: false,
    };
  }

  let cycle = false;
  const result = [];

  function visit(node) {
    if (node.permanent_mark) {
      return;
    }
    if (node.temporary_mark) {
      cycle = true;
      return;
    }
    node.temporary_mark = true;
    if (node.dep) {
      for (let i = 0; i < node.dep.length; i++) {
        visit(domain[name_to_id[node.dep[i]]]);
      }
    }
    node.temporary_mark = false;
    node.permanent_mark = true;
    result.push(node);
  }

  const unmarked = domain.slice();
  while (unmarked.length != 0 && !cycle) {
    if (unmarked[0].permanent_mark) {
      unmarked.shift();
    } else {
      visit(unmarked[0]);
    }
  }
  if (cycle) return false;

  for (let i = 0; i < result.length; i++) {
    result[i] = name_to_id[result[i].name];
  }
  return result;
}

function find_depended_on(domain) {
  const result = [];
  const name_to_id = [];
  for (let i = 0; i < domain.length; i++) {
    name_to_id[domain[i].name] = i;
    result[i] = false;
  }
  for (let i = 0; i < domain.length; i++) {
    const dep = domain[i].dep;
    if (dep) {
      for (let j = 0; j < dep.length; j++) {
        result[name_to_id[dep[j]]] = true;
      }
    }
  }

  return result;
}

/*---------------------------------------------------------------------*/
/*    CTRec ...                                                        */
/*---------------------------------------------------------------------*/
function CTRec(thunk) {
  let _thunkctc = false;

  function mthunk() {
    if (!_thunkctc) {
      _thunkctc = CTCoerce(thunk(), "CTRec");
    }

    return _thunkctc;
  }

  function firstOrder(x) {
    return mthunk().firstOrder(x);
  }

  return new CT("CTRec", firstOrder, function (blame_object) {
    let ei = false;
    function mkWrapper(blame_object, kt) {
      return new CTWrapper(function (value) {
        if (!ei) ei = mthunk().wrapper(blame_object);
        return ei[kt].ctor(value);
      });
    }
    return {
      t: mkWrapper(blame_object, "t"),
      f: mkWrapper(blame_swap(blame_object), "f"),
    };
  });
}

/*---------------------------------------------------------------------*/
/*    CTAnd ....                                                       */
/*---------------------------------------------------------------------*/
function CTAnd(...args) {
  const argcs = args.map((a) => CTCoerce(a, "CTAnd"));
  return new CT(
    "CTAnd",
    (x) => {
      for (let i = 0; i < argcs.length; ++i) {
        if (!argcs[i].firstOrder(x)) return false;
      }
      return true;
    },
    function (blame_object) {
      function mkWrapper(blame_object, kt) {
        const handler = {
          apply: function (target, self, target_args) {
            const blame_objects = neg_choice(blame_object, argcs.length);
            var wrapped_target = target;
            for (let i = 0; i < argcs.length; ++i) {
              const ei = argcs[i].wrapper(blame_objects[i]);
              wrapped_target = ei[kt].ctor(wrapped_target);
            }
            // MS 30apr2021: is it correct not to apply any contract to self?
            const r = wrapped_target.apply(self, target_args);
            return r;
          },
        };
        return new CTWrapper(function (value) {
          for (let i = 0; i < argcs.length; ++i) {
            if (!argcs[i].firstOrder(value)) {
              signal_contract_violation(
                value,
                blame_object,
                "CTAnd argument " + i + " didn't apply: " + value
              );
            }
          }
          if (value && typeof value === "object" || typeof value === "function")
              return new Proxy(value, handler);
          return value;
        });
      }
      return {
        t: mkWrapper(blame_object, "t"),
        f: mkWrapper(blame_swap(blame_object), "f"),
      };
    }
  );
}

/*---------------------------------------------------------------------*/
/*    CTOr ...                                                         */
/*---------------------------------------------------------------------*/
function CTOrExplicitChoice(lchoose, left, rchoose, right) {
  return new CT(
    "CTOr",
    (x) => lchoose(x) || rchoose(x),
    function (blame_object) {
      function mkWrapper(blame_object, kt) {
        const ei_l = left.wrapper(blame_object);
        const ei_r = right.wrapper(blame_object);
        return new CTWrapper(function (value) {
          const is_l = lchoose(value);
          const is_r = rchoose(value);
          if (is_l) return ei_l[kt].ctor(value);
          if (is_r) return ei_r[kt].ctor(value);
          return signal_contract_violation(
            value,
            blame_object,
            "CTOr neither applied: " + value
          );
        });
      }
      return {
        t: mkWrapper(blame_object, "t"),
        f: mkWrapper(blame_swap(blame_object), "f"),
      };
    }
  );
}

function CTOr(...args)  {
    const argcs = args.map((a) => CTCoerce(a, "CTOr"));
    const or_first_order = (x) => {
        for (let i = 0; i < argcs.length; ++i) {
            if (argcs[i].firstOrder(x)) return true;
        }
        return false;
    }
    return new CT(
        "CTOr",
        or_first_order,
        function (blame_object) {
            function mkWrapper(blame_object, kt) {
                function do_wrapping(target) {
                    const blame_objects = pos_choice(blame_object, argcs.length);
                    var wrapped_target = target;
                    for (let i = 0; i < argcs.length; ++i) {
                        const ei = argcs[i].wrapper(blame_objects[i]);
                        wrapped_target = ei[kt].ctor(wrapped_target);
                    }
                    return wrapped_target;
                }
                const handler = {
                    apply: function (target, self, target_args) {
                        const wrapped_target = do_wrapping(target);
                        // MS 30apr2021: is it correct not to apply any contract to self?
                        return wrapped_target.apply(self, target_args);
                    },
                    get: function(target, prop, receiver) {
                        const wrapped_target = do_wrapping(target);
                        return wrapped_target[prop];
                    }
                };
                return new CTWrapper(function (value) {
                    if (! or_first_order(value) ) {
                        signal_contract_violation(
                            value,
                            blame_object,
                            "CTOr no arguments applied: " + value
                        );
                    }
                    if (value && typeof value === "object" || typeof value === "function")
                        return new Proxy(value, handler);
                    return value;
                });
            }
            return {
                t: mkWrapper(blame_object, "t"),
                f: mkWrapper(blame_swap(blame_object), "f"),
            };
        }
    );
}

/*---------------------------------------------------------------------*/
/*    CTArray ...                                                      */
/*---------------------------------------------------------------------*/
function CTArray(element, options) {
  function firstOrder(x) {
    return x instanceof Array;
  }

  const immutable = typeof options == "object" && !!options.immutable;

  const element_ctc = CTCoerce(element, "CTArray");

  return new CT("CTArray", firstOrder, function (blame_object) {
    function mkWrapper(blame_object, kt, kf) {
      const ei = element_ctc.wrapper(blame_object);

      const handler = {
        get: function (target, prop) {
          if (typeof prop === "string" && prop.match(/^[0-9]+$/)) {
            return ei[kt].ctor(target[prop]);
          } else {
            return target[prop];
          }
        },
        set: function (target, prop, newval) {
          if (immutable) {
            return signal_contract_violation(
              // we're supposed to return true here
              // after the mutation goes through,
              // but we still reject the mutation
              // becuase we return without updating the array.
              // is this correct?
              true,
              blame_swap(blame_object),
              "Cannot mutate immutable array"
            );
          }
          if (prop.match(/^[0-9]+$/)) {
            target[prop] = ei[kf].ctor(newval);
          } else {
            target[prop] = newval;
          }
          return true;
        },
      };

      return new CTWrapper(function (value) {
        if (firstOrder(value)) {
          return new Proxy(value, handler);
        } else {
          return signal_contract_violation(
            value,
            blame_object,
            "Not an array `" + value + "' "
          );
        }
      });
    }

    return {
      t: mkWrapper(blame_object, "t", "f"),
      f: mkWrapper(blame_swap(blame_object), "f", "t"),
    };
  });
}

/*---------------------------------------------------------------------*/
/*    CTObject ...                                                     */
/*---------------------------------------------------------------------*/
function CTObject(ctfields) {
  let stringIndexContract = false,
    numberIndexContract = false;
  let fields = {};

  for (let k in ctfields) {
    const p = ctfields[k];

    if ("contract" in p) {
      if (p.index === "string") {
        stringIndexContract = CTCoerce(p.contract, k + "@CTObject");
      } else if (p.index === "number") {
        numberIndexContract = CTCoerce(p.contract, k + "@CTObject");
      } else {
        fields[k] = {
          contract: CTCoerce(p.contract, k + "@CTObject"),
          optional: p.optional,
        };
      }
    } else {
      fields[k] = { contract: CTCoerce(p, k + "@CTObject") };
    }
  }

  function firstOrder(x) {
    if (x instanceof Object) {
      for (let n in fields) {
        if (!(n in x) && !fields[n].optional) return false;
      }

      for (let n in x) {
        if (!(n in fields)) {
          if (typeof n === "string" && !stringIndexContract) {
            return false;
          }
          if (typeof n === "number" && !numberIndexContract) {
            return false;
          }
        }
      }

      return true;
    } else {
      return false;
    }
  }

  return new CT("CTObject", firstOrder, function (blame_object) {
    function mkWrapper(blame_object, kt, kf) {
      const ei = {};
      const eis =
        stringIndexContract && stringIndexContract.wrapper(blame_object);
      const ein =
        numberIndexContract && numberIndexContract.wrapper(blame_object);

      for (let k in fields) {
        const ctc = fields[k].contract;

        ei[k] = ctc.wrapper(blame_object);
      }
      function makeHandler(priv) {
        return {
          get: function (target, prop) {
            const ct =
              ei[prop] ||
              (typeof prop === "string" && eis) ||
              (typeof prop === "number" && ein);

            const cache = priv[prop];

            if (ct) {
              if (cache) {
                return cache;
              } else {
                const targetProp = target[prop];
                if (fields[prop]?.optional && targetProp === undefined) {
                  return targetProp;
                }
                const cv = ct[kt].ctor(targetProp);
                priv[prop] = cv;
                return cv;
              }
            } else {
              return target[prop];
            }
          },
          set: function (target, prop, newval) {
            const ct = ei[prop];

            if (ct) {
              priv[prop] = false;
              target[prop] = ct[kf].ctor(newval);
            } else {
              target[prop] = newval;
            }
            return true;
          },
        };
      }

      return new CTWrapper(function (value) {
        if (firstOrder(value)) {
          return new Proxy(value, makeHandler({}));
        } else {
          // TODO: this error message is not always accurate
          return signal_contract_violation(
            value,
            blame_object,
            `Object mismatch, expecting "${toString(fields)}", got "${toString(
              value
            )}"`
          );
        }
      });
    }

    return {
      t: mkWrapper(blame_object, "t", "f"),
      f: mkWrapper(blame_swap(blame_object), "f", "t"),
    };
  });
}

/*---------------------------------------------------------------------*/
/*    CTCoerce ...                                                     */
/*---------------------------------------------------------------------*/
function CTCoerce(obj, who) {
  if (typeof obj === "function") {
    return CTCoerce(CTFlat(obj), who);
  } else if (obj === true) {
    return CTCoerce(
      CTFlat((v) => true),
      who
    );
  } else if (isNumber(obj)) {
    return CTCoerce(
      CTFlat((v) => obj === v),
      who
    );
  } else {
    if (obj instanceof CT) {
      return obj;
    } else {
      throw new ContractError(
        (who ? who + ": " : "") + "not a contract `" + obj + "'"
      );
    }
  }
}

/*---------------------------------------------------------------------*/
/*    CTPromise ...                                                    */
/*---------------------------------------------------------------------*/
function CTPromise(res, rej) {
  function firstOrder(x) {
    return x instanceof Promise && x.__proto__ === Promise.prototype;
  }

  return new CT("CTPromise", firstOrder, function (blame_object) {
    function mkWrapper(blame_object, kt, kf) {
      return new CTWrapper(function (value) {
        if (firstOrder(value)) {
          // Interpose a new Promise.prototype that will wrap
          // the promise handler
          const proto = Object.create(Promise.prototype);
          proto.then = (t, f) =>
            Promise.prototype.then.call(
              value,
              res.wrap(t),
              rej ? rej.wrap(f) : f
            );

          // Create the wrapped promise by merely
          // duplicating the initial promise.
          const prom = value.then(
            (x) => x,
            (x) => x
          );
          prom.__proto__ = proto;

          return prom;
        } else {
          return signal_contract_violation(
            value,
            blame_object,
            "Not a promise `" + value + "': "
          );
        }
      });
    }
    return {
      t: mkWrapper(blame_object, "t", "f"),
      f: mkWrapper(blame_swap(blame_object), "f", "t"),
    };
  });
}

/*---------------------------------------------------------------------*/
/*    Blame Objects                                                    */
/*---------------------------------------------------------------------*/

/*
blame_object = 
  { pos: name of potential blame party
    neg: name of potential blame party
    dead : (or/c false                      -- not involved in or/and contract
                { dead : (or/c false        -- still alive
                               string) } )  -- dead with this error message
    pos_state: (or/c false          -- no and/or in play
                     blame_object)  -- our sibling in the or/and
    neg_state: same as pos_state
  }
// INVARIANT: (dead != false) <=> (pos_state != false) or (neg_state != false)
*/

function new_blame_object(pos, neg) {
  return {
    pos: pos,
    neg: neg,
    dead: false,
    pos_state: false,
    neg_state: false,
  };
}
function blame_swap(blame_object) {
  return {
    pos: blame_object.neg,
    neg: blame_object.pos,
    dead: blame_object.dead,
    pos_state: blame_object.neg_state,
    neg_state: blame_object.pos_state,
  };
}
function blame_replace_neg(blame_object, new_neg) {
  return {
    pos: blame_object.pos,
    neg: new_neg,
    dead: blame_object.dead,
    pos_state: blame_object.pos_state,
    neg_state: blame_object.neg_state,
  };
}
function neg_choice(blame_object, howmany) {
  const blame_objects = [];
  for (let i = 0; i < howmany; ++i) {
    blame_objects[i] = {
      pos: blame_object.pos,
      neg: blame_object.neg,
      dead: { dead: false },
      neg_state: blame_objects,
      pos_state: blame_object.pos_state,
    };
  }
  return blame_objects;
}
function pos_choice(blame_object, howmany) {
  const blame_objects = [];
  for (let i = 0; i < howmany; ++i) {
    blame_objects[i] = {
      pos: blame_object.pos,
      neg: blame_object.neg,
      dead: { dead: false },
      neg_state: blame_object.neg_state,
      pos_state: blame_objects,
    };
  }
  return blame_objects;
}

function signal_contract_violation(value, blame_object, message) {
  if (typeof blame_object.dead === "boolean") {
    // regular contract violation, no and/or here
    throw_contract_violation(blame_object.pos, message, value);
  } else if (blame_object.dead.dead) {
    // we're already dead (but some siblings aren't)
    return value;
  } else if (typeof blame_object.pos_state === "boolean") {
    // we're in an and/or contract, but this is not the side with
    // the choice, so signal a violation
    throw_contract_violation(blame_object.pos, message, value);
  } else {
    // we're newly dead
    blame_object.dead.dead = message;
    const siblings = blame_object.pos_state;
    var all_dead = true;
    for (let i = 0; i < siblings.length; ++i) {
      all_dead = all_dead && siblings[i].dead.dead;
    }
    if (all_dead) {
      // there were no viable choices
      var complete_message = "";
      for (let i = 0; i < siblings.length; ++i) {
        complete_message += i === 0 ? "" : "\n     also: ";
        complete_message += siblings[i].dead.dead;
      }
      throw_contract_violation(blame_object.pos, complete_message, value);
    } else {
      // sibling isn't dead yet, so keep going
      return value;
    }
  }
}

function throw_contract_violation(pos, message, value) {
  const valueKeys = Object.keys(value || {});
  const keyMessage =
    valueKeys.length > 0 ? `\n    keys: {${valueKeys.join(", ")}}` : "";
  const nullMessage =
    value === null
      ? `\n    NOTE: value is null (since typeof null === object)`
      : "";
  const errorMessage = `${message}
    blaming: ${pos}
    value type: ${typeof value}`;
  throw new ContractError(`${errorMessage}${nullMessage}${keyMessage}`);
}

/*---------------------------------------------------------------------*/
/*    predicates ...                                                   */
/*---------------------------------------------------------------------*/
function isObject(o) {
  return typeof o === "object" && o !== null;
}
function isNull(o) {
  return o === null;
}
function isFunction(o) {
  return typeof o === "function";
}
function isString(o) {
  return typeof o === "string";
}
function isBoolean(o) {
  return typeof o === "boolean";
}
function isNumber(o) {
  return typeof o === "number";
}
function isUndefined(o) {
  return typeof o === "undefined";
}
function isError(o) {
  return o instanceof Error;
}
function True(o) {
  return true;
}
function isArrayBuffer(o) {
  return o instanceof ArrayBuffer;
}
function isBuffer(o) {
  return o instanceof Buffer;
}
function isStringC(o) {
  return o instanceof String;
}
function isNumberC(o) {
  return o instanceof Number;
}
function isBooleanC(o) {
  return o instanceof Boolean;
}
function isSymbolC(o) {
  return typeof o === "symbol";
}
function isObjectC(o) {
  return o instanceof Object;
}
function isBigInt(o) {
  return typeof o === "bigint";
}
function isRegExp(o) {
  return o instanceof RegExp;
}

const booleanCT = new CTFlat(isBoolean);
const numberCT = new CTFlat(isNumber);
const objectCT = new CTFlat(isObject);
const stringCT = new CTFlat(isString);
const trueCT = new CTFlat((o) => true);
const arrayBufferCT = new CTFlat(isArrayBuffer);
const undefinedCT = new CTFlat(isUndefined);
const errorCT = new CTFlat(isError);
const nullCT = new CTFlat(isNull);
const bufferCT = new CTFlat(isBuffer);
const StringCT = new CTFlat(isStringC);
const NumberCT = new CTFlat(isNumberC);
const BooleanCT = new CTFlat(isBooleanC);
const SymbolCT = new CTFlat(isSymbolC);
const ObjectCT = new CTFlat(isObjectC);
const BigIntCT = new CTFlat(isBigInt);
const RegExpCT = new CTFlat(isRegExp);

/*---------------------------------------------------------------------*/
/*    exports                                                          */
/*---------------------------------------------------------------------*/
exports.anyCT = trueCT;
exports.voidCT = undefinedCT;
exports.booleanCT = booleanCT;
exports.objectCT = objectCT;
exports.stringCT = stringCT;
exports.trueCT = trueCT;
exports.undefinedCT = undefinedCT;
exports.errorCT = errorCT;
exports.numberCT = numberCT;
exports.arrayBufferCT = arrayBufferCT;
exports.nullCT = nullCT;
exports.bufferCT = bufferCT;
exports.StringCT = StringCT;
exports.NumberCT = NumberCT;
exports.BooleanCT = BooleanCT;
exports.SymbolCT = SymbolCT;
exports.ObjectCT = ObjectCT;
exports.BigIntCT = BigIntCT;
exports.RegExpCT = RegExpCT;

exports.CTObject = CTObject;
exports.CTInterface = CTObject;
exports.CTOr = CTOr;
exports.CTAnd = CTAnd;
exports.CTRec = CTRec;
exports.CTFunction = CTFunction;
exports.CTFunctionOpt = CTFunctionOpt;
exports.CTFunctionD = CTFunctionD;
exports.CTPromise = CTPromise;
exports.CTArray = CTArray;
exports.CTFlat = CTFlat;

exports.isObject = isObject;
exports.isFunction = isFunction;
exports.isString = isString;
exports.isBoolean = isBoolean;
exports.isNumber = isNumber;
exports.True = True;

// exported for the test suite only
exports.__topsort = topsort;
exports.__find_depended_on = find_depended_on;
exports.__toString = toString;

exports.CTexports = function (ctc, val, locationt) {
  return (locationf) =>
    CTCoerce(ctc, "CTExports " + locationt).wrap(val, locationt, locationf);
};

exports.CTimports = function (obj, location) {
  let res = {};
  for (let k in obj) {
    res[k] = obj[k](location);
  }
  return res;
};
