"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _humanizeNumber = _interopRequireDefault(require("humanize-number"));
var _bytes = _interopRequireDefault(require("bytes"));
var _chalk = _interopRequireDefault(require("chalk"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var _default = ({
  logger = console.log,
  addFields,
  exclude
} = {}) => async (ctx, next) => {
  // check if this log instance is excluded
  const excluded = !exclude || !exclude(ctx);
  if (!excluded) {
    return next();
  }

  // calculate the start time
  const start = ctx[Symbol.for('request-received.startTime')] ? ctx[Symbol.for('request-received.startTime')].getTime() : Date.now();
  const customInfo = addFields ? addFields(ctx) : {};
  const baseLogInfo = _objectSpread({
    name: process.env.npm_package_name,
    version: process.env.npm_package_version,
    ip: ctx.ips.length > 0 ? ctx.ips[0] : ctx.ip,
    method: ctx.method,
    url: ctx.originalUrl
  }, customInfo);

  // log the request
  logger(_chalk.default.yellow('request'));
  logger(_objectSpread({
    time: new Date().toISOString(),
    timestamp: new Date().getTime()
  }, baseLogInfo));
  try {
    await next();
  } catch (error) {
    // log uncaught downstream errors
    logger(_chalk.default.red('error'));
    error.message && logger(error.message);
    logger(error);
    throw error;
  }

  // log when the response is finished or closed, whichever happens first
  const {
    res
  } = ctx;
  const done = () => {
    res.removeListener('finish', onfinish);
    res.removeListener('close', onclose);

    // log the response
    logger(_chalk.default.yellow('response'));
    logger(_objectSpread(_objectSpread({
      time: new Date().toISOString(),
      timestamp: new Date().getTime()
    }, baseLogInfo), {}, {
      status: ctx.status,
      response_size: getResponseLength(ctx),
      response_time: getResponseTime(start)
    }));
  };
  const onfinish = done.bind(null, 'finish');
  const onclose = done.bind(null, 'close');
  res.once('finish', onfinish);
  res.once('close', onclose);
}; // get the human readable response length
exports.default = _default;
const getResponseLength = ctx => {
  const length = ctx.response.length;
  const status = ctx.status;
  if ([204, 205, 304].includes(status)) {
    return '';
  }
  if (length === null) {
    return '-';
  }
  return (0, _bytes.default)(length).toLowerCase();
};

// show the response time in human readable format.
const getResponseTime = start => {
  const delta = Date.now() - start;
  return (0, _humanizeNumber.default)(delta < 10000 ? delta + 'ms' : Math.round(delta / 1000) + 's');
};