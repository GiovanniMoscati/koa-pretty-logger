"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _humanizeNumber = _interopRequireDefault(require("humanize-number"));

var _bytes = _interopRequireDefault(require("bytes"));

var _chalk = _interopRequireDefault(require("chalk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _default = ({
  logger = console.log,
  addFields,
  exclude
} = {}) => async (ctx, next) => {
  // check if this log instance is excluded
  const excluded = !exclude || !exclude(ctx);

  if (!excluded) {
    return next();
  } // calculate the start time


  const start = ctx[Symbol.for('request-received.startTime')] ? ctx[Symbol.for('request-received.startTime')].getTime() : Date.now();
  const customInfo = addFields ? addFields(ctx) : {};

  const baseLogInfo = _objectSpread({
    name: process.env.npm_package_name,
    version: process.env.npm_package_version,
    ip: ctx.ips.length > 0 ? ctx.ips[0] : ctx.ip,
    method: ctx.method,
    url: ctx.originalUrl
  }, customInfo); // log the request


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
  } // log when the response is finished or closed, whichever happens first


  const {
    res
  } = ctx;

  const done = () => {
    res.removeListener('finish', onfinish);
    res.removeListener('close', onclose); // log the response

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
}; // show the response time in human readable format.


const getResponseTime = start => {
  const delta = Date.now() - start;
  return (0, _humanizeNumber.default)(delta < 10000 ? delta + 'ms' : Math.round(delta / 1000) + 's');
};