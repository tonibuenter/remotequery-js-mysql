const { namedParameters2QuestionMarks } = require('../remotequery-mysql');

let tests = [
  {
    sql: 'select * from T_BLA where U = :u',
    parameters: { u: 123 },
    txt: '',
    key: ['u'],
    key2: ['']
  },
  {
    sql: 'select * from T_BLA where U = :u and list = :list[]',
    parameters: { u: 'hello!!', list: '23,212,132,2,aa'.split(',') },
    txt: '',
    key: ['u'],
    key2: ['']
  },
  {
    sql: 'select * from T_BLA where U = :u and list = :list[]',
    parameters: { u: 123, list: '23,212,132,2,aa' },
    txt: '',
    key: ['u'],
    key2: ['']
  }
];

tests = [
  {
    sql: 'select * from T_BLA where U = :u and list = :list',
    parameters: { u: 'hello!!', list: '23,212,132,2,aa'.split(',') },
    txt: '',
    key: ['u'],
    key2: ['']
  }
];

// const assert = require('chai');

describe('regexp', function () {
  describe('test1', function () {
    tests.forEach((test, index) => {
      it('test-' + index, function () {
        let { sql, parameters, txt, key, key2 } = test;
        let { sqlqm, parametersUsed, values } = namedParameters2QuestionMarks(sql, parameters);
        console.log(sql);
        console.log(sqlqm);
        console.log(values);
        console.log(parametersUsed);
      });
    });
  });
});
