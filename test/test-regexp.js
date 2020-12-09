const { namedParameters2QuestionMarks } = require('../remotequery-mysql');
const assert = require('chai').assert;

let tests = [
  {
    sql: 'select * from T_USER where NAME = :u',
    parameters: { u: 123 },
    txt: '',
    key: ['u'],
    key2: ['']
  },
  {
    sql: 'select * from T_USER where NAME = :u and EMAIL = :list[]',
    parameters: { u: 'hello!!', list: '23,212,132,2,aa'.split(',') },
    txt: '',
    key: ['u'],
    key2: ['']
  },
  {
    sql: 'select * from T_USER where NAME = :u and EMAIL = :list[]',
    parameters: { u: 123, list: '23,212,132,2,aa' },
    txt: '',
    key: ['u'],
    key2: ['']
  }
];

tests = [
  {
    sql: 'select :NAME from T_USER where USER_TID = :$USERID and VALUE = :vs[]',
    parameters: { birthday: '1992-09-12', $USERID: 1234, vs: [1, 2, 3].join(' , ') },
    sqlQm: 'select ? from T_USER where USER_TID = ? and VALUE = ?,?,?',
    values: [undefined, 1234, '1', '2', '3'],
    parametersUsed: { NAME: undefined, $USERID: 1234, vs0: '1', vs1: '2', vs2: '3' }
  },
  {
    sql: 'select * from T_USER where USER_TID = :u and USER_TID = :list',
    parameters: { u: 'hello!!', list: '23,212,132,2,aa'.split(',') },
    sqlQm: 'select * from T_USER where USER_TID = ? and USER_TID = ?,?,?,?,?',
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
    sql: 'select :NAME from T_USER where USER_TID = :$USERID and VALUE = :v',
    parameters: { NAME: 'sepp', $USERID: 1234, v: 'sdfne?kj,sdfkI"' },
    sqlQm: 'select ? from T_USER where USER_TID = ? and VALUE = ?',
    values: ['sepp', 1234, 'sdfne?kj,sdfkI"'],
    parametersUsed: { NAME: 'sepp', $USERID: 1234, v: 'sdfne?kj,sdfkI"' }
  },
  {
    sql: 'select :NAME from T_USER where USER_TID = :$USERID and VALUE = :vs',
    parameters: { NAME: 'sepp', $USERID: 1234, vs: [1, 2, 3] },
    sqlQm: 'select ? from T_USER where USER_TID = ? and VALUE = ?,?,?',
    values: ['sepp', 1234, 1, 2, 3],
    parametersUsed: { NAME: 'sepp', $USERID: 1234, vs0: 1, vs1: 2, vs2: 3 }
  },
  {
    // trimmed, [], white space,
    sql: 'select :NAME from T_USER where USER_TID = :$USERID and VALUE = :vs[]',
    parameters: { NAME: '  sepp ', $USERID: 1234, vs: [1, 2, 3].join('   , '), v: 'unused-param' },
    sqlQm: 'select ? from T_USER where USER_TID = ? and VALUE = ?,?,?',
    values: ['sepp', 1234, '1', '2', '3'],
    parametersUsed: { NAME: 'sepp', $USERID: 1234, vs0: '1', vs1: '2', vs2: '3' }
  },
  {
    // trimmed, [], white space,
    sql: 'select NAME from T_USER where $USER_TID = 123',
    parameters: { NAME: '  sepp ', $USERID: 1234, vs: [1, 2, 3].join('   , '), v: 'unused-param' },
    sqlQm: 'select NAME from T_USER where $USER_TID = 123',
    values: [],
    parametersUsed: {}
  },
  {
    // trimmed, [], white space,
    sql: 'select * from T_USER where VALUE = :vs[]',
    parameters: { NAME: '  sepp ', $USERID: 1234, v: 'unused-param' },
    sqlQm: 'select * from T_USER where VALUE = ?',
    values: [undefined],
    parametersUsed: { vs0: undefined }
  },
  {
    sql: "select * from T_USER where NAME = ':hans:' and USER_TID=:uid",
    parameters: { uid: 123 },
    sqlQm: "select * from T_USER where NAME = ':hans:' and USER_TID=?",
    values: [123],
    parametersUsed: { uid: 123 }
  },
  {
    sql: "select * from T_USER where NAME = ':hans[]:hans::' and USER_TID=:uid[]",
    parameters: { uid: 123 },
    sqlQm: "select * from T_USER where NAME = ':hans[]:hans::' and USER_TID=?",
    values: [123],
    parametersUsed: { uid0: 123 }
  }
];

describe('regexp', function () {
  describe('test1', function () {
    tests.forEach((test, index) => {
      it('test-' + index, function () {
        let { sql, parameters, txt, key, key2 } = test;
        let { sqlQm, values, parametersUsed } = namedParameters2QuestionMarks(sql, parameters);
        assert.equal(test.sqlQm, sqlQm);
        assert.deepEqual(test.values, values);
        assert.deepEqual(test.parametersUsed, parametersUsed);
      });
    });
    it('test-log', function () {
      let sql = "select * from T_USER where NAME = ':hans:' and USER_TID=:uid";
      let { sqlQm, values, parametersUsed } = namedParameters2QuestionMarks(sql, {});
    });
    it('test-log2', function () {
      let sql = "select * from T_USER where NAME = ':hans[]' and USER_TID=:uid";
      let { sqlQm, values, parametersUsed } = namedParameters2QuestionMarks(sql, {}, console.log);
    });
  });
});
