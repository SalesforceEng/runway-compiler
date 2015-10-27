"use strict";

let errors = require('../errors.js');
let either = require('../types/either.js');
let Expression = require('./expression.js');

class RecordValue extends Expression {
  constructor(parsed, env) {
    super(parsed, env);
    let makeExpression = require('./factory.js');
    this.fields = new Map(this.parsed.fields.map((field) => [
        field.id.value,
        makeExpression(field.expr, this.env),
    ]));
  }

  evaluate() {
    let value = this.type.makeDefaultValue();
    this.fields.forEach((field, name) => {
      value.set(name, field.evaluate());
    });
    return value;
  }

  typecheck() {
    this.type = this.env.getType(this.parsed.type.value);

    if (this.type === undefined) {
      this.env.getTypeNames().forEach((name) => {
        let type = this.env.getType(name);
        if (type instanceof either.Type) {
          let variant = type.getVariant(this.parsed.type.value);
          if (variant !== undefined) {
            this.type = variant;
          }
        }
      });
    }

    if (this.type === undefined) {
      throw new errors.Lookup(`No type ${this.parsed.type.value} found in environment: ${this.parsed.type.source}`);
    }

    this.fields.forEach((field) => field.typecheck());

    this.fields.forEach((field, name) => {
      if (this.type.fieldType(name) === undefined) {
        throw new errors.Type(`No field ${name} found in ${this.type} record`);
      }
    });

  // XXX- throw TypeError if field is missing? or just default it?
  }

}

module.exports = RecordValue;