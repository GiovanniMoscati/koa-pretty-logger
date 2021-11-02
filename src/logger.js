import humanize from 'humanize-number';
import bytes from 'bytes';
import chalk from 'chalk';

export default ({ logger = console.log, addFields, exclude } = {}) =>
  async (ctx, next) => {
    // check if this log instance is excluded
    const excluded = !exclude || !exclude(ctx);
    if (!excluded) {
      return next();
    }

    // calculate the start time
    const start = ctx[Symbol.for('request-received.startTime')] ? ctx[Symbol.for('request-received.startTime')].getTime() : Date.now();

    const customInfo = addFields ? addFields(ctx) : {};
    const baseLogInfo = {
      name: process.env.npm_package_name,
      version: process.env.npm_package_version,
      ip: ctx.ips.length > 0 ? ctx.ips[0] : ctx.ip,
      method: ctx.method,
      url: ctx.originalUrl,
      ...customInfo,
    };

    // log the request
    logger(chalk.yellow('request'));
    logger({
      time: new Date().toISOString(),
      timestamp: new Date().getTime(),
      ...baseLogInfo,
    });

    try {
      await next();
    } catch (error) {
      // log uncaught downstream errors
      logger(chalk.red('error'));
      error.message && logger(error.message);
      logger(error);

      throw error;
    }

    // log when the response is finished or closed, whichever happens first
    const { res } = ctx;

    const done = () => {
      res.removeListener('finish', onfinish);
      res.removeListener('close', onclose);

      // log the response
      logger(chalk.yellow('response'));
      logger({
        time: new Date().toISOString(),
        timestamp: new Date().getTime(),
        ...baseLogInfo,
        status: ctx.status,
        response_size: getResponseLength(ctx),
        response_time: getResponseTime(start),
      });
    };

    const onfinish = done.bind(null, 'finish');
    const onclose = done.bind(null, 'close');

    res.once('finish', onfinish);
    res.once('close', onclose);
  };

// get the human readable response length
const getResponseLength = (ctx) => {
  const length = ctx.response.length;
  const status = ctx.status;
  if ([204, 205, 304].includes(status)) {
    return '';
  }
  if (length === null) {
    return '-';
  }
  return bytes(length).toLowerCase();
};

// show the response time in human readable format.
const getResponseTime = (start) => {
  const delta = Date.now() - start;
  return humanize(delta < 10000 ? delta + 'ms' : Math.round(delta / 1000) + 's');
};
