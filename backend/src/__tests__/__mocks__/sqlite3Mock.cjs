// Mock for sqlite3 — prevents real DB file creation during tests.
// db.js calls new sqlite3.Database(path, cb) then db.serialize(...).
const mockDb = {
  serialize: jest.fn(fn => fn && fn()),
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
};

function Database(path, cb) {
  if (typeof cb === 'function') cb(null); // signal successful connection
  return Object.assign(Object.create(Database.prototype), mockDb);
}

Database._mockDb = mockDb;

module.exports = { Database };
