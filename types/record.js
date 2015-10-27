"use strict";

let errors = require('../errors');
let Type = require('./type.js');
let Value = require('./value.js');

class RecordValue extends Value {

  constructor(type) {
    super(type);
    this.type.fieldtypes.forEach((fieldtype) => {
      this[fieldtype.name] = fieldtype.type.makeDefaultValue();
    });
  }

  assign(other) {
    if (other === undefined) {
      throw new errors.Internal(`Can't assign undefined to ${this}`);
    }
    if (this.type !== other.type) {
      throw new errors.Internal(`Can't assign ${other} to ${this}`);
    }
    this.type.fieldtypes.forEach((fieldtype) => {
      this[fieldtype.name] = other[fieldtype.name];
    });
  }

  equals(other) {
    if (this.type !== other.type) {
      return false;
    }
    let equal = true;
    this.type.fieldtypes.forEach((fieldtype) => {
      if (typeof this[fieldtype.name].equals != 'function') {
        throw new errors.Internal(`This value doesn't have equals(): ${this[fieldtype.name]}`);
      }
      if (!this[fieldtype.name].equals(other[fieldtype.name])) {
        equal = false;
      }
    });
    return equal;
  }

  lookup(fieldname) {
    return this[fieldname];
  }

  set(fieldname, value) {
    this[fieldname] = value;
  }

  innerToString() {
    let fields = this.type.decl.fields.map((v) => {
      let rhs = this[v.id.value].toString();
      return `${v.id.value}: ${rhs}`;
    }).join(', ');
    return fields;
  }

  toString() {
    let name = this.type.getName();
    let fields = this.type.decl.fields.map((v) => {
      let rhs = this[v.id.value].toString();
      return `${v.id.value}: ${rhs}`;
    }).join(', ');
    return `${name} { ${fields} }`;
  }
}


class RecordType extends Type {
  constructor(decl, env, name) {
    super(decl, env, name);
    let makeType = require('./factory.js');
    this.fieldtypes = this.decl.fields.map((field) => ({
        name: field.id.value,
        type: makeType(field.type, this.env),
    }));
  }
  fieldType(name) {
    let retval = undefined;
    this.fieldtypes.forEach((ft) => {
      if (ft.name == name) {
        retval = ft.type;
      }
    });
    return retval;
  }
  makeDefaultValue() {
    return new RecordValue(this);
  }
  toString() {
    let name = this.getName();
    if (name !== undefined) {
      return name;
    }
    return 'anonymous record';
  }
}

module.exports = RecordType;