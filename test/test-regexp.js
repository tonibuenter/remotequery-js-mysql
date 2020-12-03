const { namedParameters2QuestionMarks } = require('../remotequery-mysql');
const assert = require('chai').assert;

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
    sql: 'select :NAME from T_BLA where U = :$USERID and VALUE = :vs[]',
    parameters: { birthday: '1992-09-12', $USERID: 1234, vs: [1, 2, 3].join(' , ') },
    sqlQm: 'select ? from T_BLA where U = ? and VALUE = ?,?,?',
    values: [undefined, 1234, '1', '2', '3'],
    parametersUsed: { NAME: undefined, $USERID: 1234, vs0: '1', vs1: '2', vs2: '3' }
  },
  {
    sql: 'select * from T_BLA where U = :u and list = :list',
    parameters: { u: 'hello!!', list: '23,212,132,2,aa'.split(',') },
    sqlQm: 'select * from T_BLA where U = ? and list = ?,?,?,?,?',
    values: ['hello!!', '23', '212', '132', '2', 'aa'],
    parametersUsed: {
      u: 'hello!!',
      list0: '23',
      list1: '212',
      list2: '132',
      list3: '2',
      list4: 'aa'
    }
  },
  {
    sql: 'select :NAME from T_BLA where U = :$USERID and VALUE = :v',
    parameters: { NAME: 'sepp', $USERID: 1234, v: 'sdfne?kj,sdfkI"' },
    sqlQm: 'select ? from T_BLA where U = ? and VALUE = ?',
    values: ['sepp', 1234, 'sdfne?kj,sdfkI"'],
    parametersUsed: { NAME: 'sepp', $USERID: 1234, v: 'sdfne?kj,sdfkI"' }
  },
  {
    sql: 'select :NAME from T_BLA where U = :$USERID and VALUE = :vs',
    parameters: { NAME: 'sepp', $USERID: 1234, vs: [1, 2, 3] },
    sqlQm: 'select ? from T_BLA where U = ? and VALUE = ?,?,?',
    values: ['sepp', 1234, 1, 2, 3],
    parametersUsed: { NAME: 'sepp', $USERID: 1234, vs0: 1, vs1: 2, vs2: 3 }
  },
  {
    // trimmed, [], white space,
    sql: 'select :NAME from T_BLA where U = :$USERID and VALUE = :vs[]',
    parameters: { NAME: '  sepp ', $USERID: 1234, vs: [1, 2, 3].join('   , '), v: 'unused-param' },
    sqlQm: 'select ? from T_BLA where U = ? and VALUE = ?,?,?',
    values: ['sepp', 1234, '1', '2', '3'],
    parametersUsed: { NAME: 'sepp', $USERID: 1234, vs0: '1', vs1: '2', vs2: '3' }
  },
  {
    // trimmed, [], white space,
    sql: 'select NAME from T_BLA where $USER_TID = 123',
    parameters: { NAME: '  sepp ', $USERID: 1234, vs: [1, 2, 3].join('   , '), v: 'unused-param' },
    sqlQm: 'select NAME from T_BLA where $USER_TID = 123',
    values: [],
    parametersUsed: {}
  },
  {
    // trimmed, [], white space,
    sql: 'select * from T_BLA where VALUE = :vs[]',
    parameters: { NAME: '  sepp ', $USERID: 1234, v: 'unused-param' },
    sqlQm: 'select * from T_BLA where VALUE = ?',
    values: [undefined],
    parametersUsed: { vs0: undefined }
  }
];

describe('regexp', function () {
  describe('test1', function () {
    tests.forEach((test, index) => {
      it('test-' + index, function () {
        let { sql, parameters, txt, key, key2 } = test;
        let { sqlQm, values, parametersUsed } = namedParameters2QuestionMarks(sql, parameters);
        assert.equal(sqlQm, test.sqlQm);
        assert.deepEqual(values, test.values);
        assert.deepEqual(parametersUsed, test.parametersUsed);
      });
    });
  });
});
