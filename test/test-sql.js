const { processSqlDirect, processSql, init } = require('../remotequery-mysql');
const assert = require('chai').assert;

let pool;
before(async () => {
  pool = init({ user: 'foo', password: 'bar', database: 'test', host: 'localhost' });
  await processSqlDirect('delete from T_USER');
});

describe('sql-stuff', function () {
  const pool = init({ user: 'foo', password: 'bar', database: 'schnauz', host: 'localhost' });

  describe('test1', function () {
    it('test-processSqlDirect', async function () {
      let r = await processSqlDirect('insert into T_USER (USER_TID, NAME) values (1234, ?)', ['beta']);
      assert.equal(r.rowsAffected, 1, 'Insert beta');
      for (let i = 0; i < 2; i++) {
        let r = await processSqlDirect('select * from T_USER where NAME = ?', ['beta']);
        assert.equal(r.table.length, 1, 'Select beta');
      }
      r = await processSqlDirect('delete from T_USER where USER_TID = ?', [1234]);
      assert.equal(r.rowsAffected, 1, 'Delete beta');
    });

    it('processSqlDirect insert/delete T_USER', async function () {
      let max = 12;
      await processSqlDirect('delete from T_USER where USER_TID < 0 ');
      for (let i = 0; i < max; i++) {
        let r = await processSqlDirect('insert into  T_USER (USER_TID, EMAIL) values (?,?)', [
          -2 * (i + 1),
          'test-email' + i
        ]);
        assert.equal(1, r.rowsAffected, 'result size');
      }
      assert.equal(
        max,
        (await processSqlDirect('delete from T_USER where USER_TID < 0 ')).rowsAffected,
        'size of deletion'
      );
    });

    it('processSql insert/delete T_USER', async function () {
      let max = 12;
      for (let i = 0; i < max; i++) {
        let r = await processSql('insert into  T_USER (USER_TID, EMAIL) values (:userTid, :email)', {
          userTid: -2 * (i + 1),
          email: 'test-email' + i
        });
        assert.equal(1, r.rowsAffected, 'result size');
      }
      assert.equal(
        max,
        (await processSqlDirect('delete from T_USER where USER_TID < 0 ')).rowsAffected,
        'size of deletion'
      );
    });

    it('processSqlDirect bulk insert/delete T_USER', async function () {
      let max = 12;
      let valueList = new Array(12).fill(1).map((_, i) => [-2 * (i + 1), 'test-email' + i]);

      let r = await processSqlDirect('insert into  T_USER (USER_TID, EMAIL) values ?', [valueList]);
      assert.equal(r.rowsAffected, max, 'result size');

      assert.equal(
        max,
        (await processSqlDirect('delete from T_USER where USER_TID < 0 ')).rowsAffected,
        'size of deletion'
      );
    });
  });
});

after(() => {
  pool.end();
});
