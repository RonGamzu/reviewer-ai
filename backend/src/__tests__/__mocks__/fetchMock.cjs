// Mock for node-fetch v3 (ESM-only — cannot be required in CJS Jest context).
const fetch = jest.fn();
module.exports = { default: fetch };
module.exports.default = fetch;
