const camelCase = require('camelcase');
const mysql = require('mysql');
const pino = require('pino');

const Config = {
  user: null,
  password: null,
  host: 'localhost',
  database: 'jground',
  logger: null,
  sqlLogger: null
};
module.exports = {
  Config,
  processSql,
  processSqlDirect,
  namedParameters2QuestionMarks,
  processSqlDirectNP,
  processSqlQuery
};

Config.logger = pino({
  level: 'info',
  prettyPrint: {
    colorize: true
  }
});

Config.sqlLogger = pino({
  level: 'info',
  prettyPrint: {
    colorize: true
  }
});

Config.initPool = function () {
  return (Config.pool = mysql.createPool({
    host: Config.host,
    user: Config.user,
    password: Config.password,
    database: Config.database
  }));
};

Config.datasource = {
  getConnection: function () {
    return new Promise((resolve, reject) => {
      Config.pool.getConnection(function (err, conn) {
        if (err) {
          reject(err);
          return;
        }
        if (conn) {
          Config.logger.debug('getConnection DONE');
          resolve(conn);
        }
      });
    });
  },
  returnConnection: function (con) {
    try {
      con.release();
    } catch (e) {
      Config.logger.error('returnConnection ->', e);
    }
    Config.logger.debug('returnConnection DONE');
  }
};

//
// PROCESS SQL CON PLUGIN - for mysql
//

const isalnum = (ch) => {
  return ch.match(/^[a-z0-9]+$/i) !== null;
};

async function processSql(sql, parameters, maxRows) {
  var con, result;
  try {
    con = await Config.datasource.getConnection();
    result = await processSql_con(con, sql, parameters, maxRows);
  } catch (err) {
    Config.logger.info(err.stack);
    result = { exception: err.message, stack: err.stack };
  } finally {
    Config.datasource.returnConnection(con);
  }
  return result;
}

async function processSqlDirect(sql, values, maxRows) {
  let con, result;
  try {
    con = await Config.datasource.getConnection();
    result = await processSqlQuery(con, sql, values, maxRows);
  } catch (err) {
    Config.logger.error(err.stack);
    result = { exception: err.message, stack: err.stack };
  } finally {
    Config.datasource.returnConnection(con);
  }
  return result;
}

async function processSqlDirectNP(sql, parametersList, maxRows) {
  let con,
    result,
    newSql,
    valuesList = [];

  for (let parameters of parametersList) {
    let { qmSql, values } = convertNamedParameterToValues(sql, parameters);
    valuesList.push(values);
    if (!newSql) {
      newSql = qmSql;
    }
  }

  try {
    con = await Config.datasource.getConnection();
    result = await processSqlQuery(con, newSql, valuesList, maxRows);
  } catch (err) {
    Config.logger.error(err.stack);
    result = { exception: err.message, stack: err.stack };
  } finally {
    Config.datasource.returnConnection(con);
  }
  return result;
}

function namedParameters2QuestionMarks(sql, parameters) {
  let parametersUsed = {};
  let values = [];
  let sqlqm = sql.replace(/:([0-9a-zA-Z$_]+)(\[?]?)/g, function (txt, key, key2) {
    let p = parameters[key];
    p = typeof p === 'string' ? p.trim() : typeof (p === 'number') ? p : p === null || p === undefined ? '' : p;
    let qms = '';
    if (key2 === '[]' || Array.isArray(p)) {
      let vList = Array.isArray(p) ? p : p.split(/\s*,\s*/);
      vList.forEach((v, index) => {
        v = v.trim();
        parametersUsed[key + index] = v;
        values.push(v);
        if (index !== 0) {
          qms += ', ';
        }
        qms += '?';
      });
    } else {
      parametersUsed[key] = p;
      values.push(p);
      qms += '?';
    }
    return qms;
  });
  return { sqlqm, parametersUsed, values };
}

function convertNamedParameterToValues(sql, parameters) {
  let parametersUsed = {};
  let values = [];

  let qmSql = sql.replace(/:([0-9a-zA-Z$_]+)(\[?]?)/g, function (txt, key, key2) {
    let p = (parameters[key] || '').trim();
    let qms = '';
    if (key2 === '[]') {
      let vList = p.split(/\s*,\s*/);
      vList.forEach((v, index) => {
        v = v.trim();
        parametersUsed[key + index] = v;
        values.push(v);
        if (index !== 0) {
          qms += ', ';
        }
        qms += '?';
      });
    } else {
      parametersUsed[key] = p.trim();
      values.push(p);
      qms += '?';
    }
    return qms;
  });

  return { qmSql, values, parametersUsed };
}

async function processSql_con(con, sql, parameters, maxRows) {
  parameters = parameters || {};
  maxRows = maxRows || 10000;

  Config.sqlLogger.debug('start sql **************************************');
  Config.sqlLogger.debug('sql: %s', sql);
  let qap = new QueryAndParams(sql, parameters);
  qap.convertQuery();
  let names = qap.param_list;
  parameters = qap.req_params;

  //
  // PREPARE SERVICE_STMT
  //

  let sql_params = [];

  for (let n of names) {
    if (parameters[n] === undefined) {
      Config.sqlLogger.info('no value provided for parameter: %s will use empty string', n);
      sql_params.push('');
    } else {
      let v = parameters[n];
      sql_params.push(v);
      Config.sqlLogger.info('sql-parameter: %s : %s', n, v);
    }
  }
  result = await processSqlQuery(con, qap.qm_query, sql_params, maxRows);
  return result;
}

function processSqlQuery(con, sql, values, maxRows) {
  return new Promise((resolve) => {
    con.query(sql, values, process_result);

    function process_result(err, res, fields) {
      let result = {};
      result.rowsAffected = -1;
      result.from = 0;
      // result.totalCount = -1;
      result.hasMore = false;

      Config.logger.debug(sql, 'DONE');

      if (err) {
        result.exception = err.message;
        result.stack = err.stack;
        resolve(result);
        Config.logger.warn(err.message + '\nsql: ' + sql);
        resolve(result);
      } else {
        // see also https://www.w3schools.com/nodejs/nodejs_mysql_select.asp
        result.headerSql = [];
        result.header = [];
        result.types = [];
        result.table = [];
        result.rowsAffected = res.affectedRows;
        Config.logger.debug('Rows affected: %s', result.rowsAffected);
        if (fields) {
          for (let field of fields) {
            result.headerSql.push(field.name);
            result.header.push(camelCase(field.name));
            result.types.push(field.type);
          }
          for (let row of res) {
            let trow = [];
            for (let head of result.headerSql) {
              trow.push(row[head]);
            }
            if (maxRows === result.table.length) {
              result.hasMore = true;
              break;
            }
            result.table.push(trow);
          }
        }
        resolve(result);
      }
    }
  });
}

class QueryAndParams {
  constructor(named_query, req_params) {
    this.named_query = named_query;
    this.req_params = req_params;
  }

  convertQuery() {
    this.qm_query = '';
    this.in_param = false;

    this.param_list = [];
    this.current_param = '';

    let prot = false;

    for (let c of this.named_query) {
      if (!prot) {
        if (this.in_param) {
          if (isalnum(c) || c === '_' || c === '$' || c === '[' || c === ']') {
            this.current_param += c;
            continue;
          } else {
            this._process_param();
          }
        }
        if (!this.in_param && c === ':') {
          this.in_param = true;
          continue;
        }
      }
      if (c === "'") {
        prot = !prot;
      }
      this.qm_query += c;
    }
    // end processing
    if (this.in_param) {
      this._process_param();
    }
    //
  }

  _process_param() {
    const param = this.current_param;
    let param_base = param.substring(0, param.length - 2);
    let a_value = this.req_params[param_base];
    if (param.endsWith('[]') || Array.isArray(a_value)) {
      if (a_value === undefined) {
        this.param_list.push(param);
        this.qm_query += '?';
      } else {
        let request_values = Array.isArray(a_value) ? a_value : a_value.split(',');
        let index = 0;
        for (let request_value of request_values) {
          let param_indexed = param_base + '[' + index + ']';
          this.req_params[param_indexed] = request_value;
          this.param_list.push(param_indexed);
          if (index === 0) {
            this.qm_query += '?';
          } else {
            this.qm_query += ',?';
          }
          index += 1;
        }
      }
    } else {
      this.param_list.push(param);
      this.qm_query += '?';
    }
    this.current_param = '';
    this.in_param = false;
  }
}

module.exports.QueryAndParams = QueryAndParams;
