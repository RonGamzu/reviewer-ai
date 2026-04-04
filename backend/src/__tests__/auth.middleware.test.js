import jwt from 'jsonwebtoken';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const SECRET = 'reviewer_ai_fallback_secret'; // matches fallback in auth.js

const makeReq = (authHeader) => ({
  headers: { authorization: authHeader },
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('requireAuth', () => {
  test('returns 401 when Authorization header is missing', () => {
    const req = makeReq(undefined);
    const res = makeRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for non-Bearer scheme', () => {
    const req = makeReq('Basic dXNlcjpwYXNz');
    const res = makeRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 for a completely invalid token', () => {
    const req = makeReq('Bearer not.a.real.jwt');
    const res = makeRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 for an expired token', () => {
    const token = jwt.sign({ id: 1, role: 'user' }, SECRET, { expiresIn: '-1s' });
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 for a token signed with the wrong secret', () => {
    const token = jwt.sign({ id: 1, role: 'user' }, 'wrong-secret');
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('calls next() and attaches user for a valid token', () => {
    const token = jwt.sign({ id: 7, username: 'alice', role: 'user' }, SECRET);
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(7);
    expect(req.user.username).toBe('alice');
  });

  test('sets req.user.role from token payload', () => {
    const token = jwt.sign({ id: 1, username: 'bob', role: 'admin' }, SECRET);
    const req = makeReq(`Bearer ${token}`);
    requireAuth(req, makeRes(), jest.fn());
    expect(req.user.role).toBe('admin');
  });
});

describe('requireAdmin', () => {
  test('returns 403 when role is "user"', () => {
    const token = jwt.sign({ id: 1, username: 'alice', role: 'user' }, SECRET);
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() when role is "admin"', () => {
    const token = jwt.sign({ id: 99, username: 'admin', role: 'admin' }, SECRET);
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 401 when no token is provided', () => {
    const req = makeReq(undefined);
    const res = makeRes();
    requireAdmin(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
