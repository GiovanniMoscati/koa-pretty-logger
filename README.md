# koa-pretty-logger

Koa simple middleware for logging the entire HTTP call flow.

* [Installation](#installation)
* [Usage](#usage)
    * [Simple Usage](#simple-usage)
    * [Log with custom fields](#log-with-custom-fields)
    * [Exclude log](#exclude-log)
* [Options](#options)

## Installation

```bash
yarn add koa-pretty-logger
```

or

```bash
npm install koa-pretty-logger
```

## Usage

### Simple Usage

```javascript
const koa = require('koa');
const logger = require('koa-pretty-log');

const app = new koa()

app.use(logger());
```

Or, if you use ES6 Modules:

```javascript
import koa from 'koa';
import logger from 'koa-pretty-log';

const app = new koa()

app.use(logger());
```

Output:
```bash
curl localhost

request
{
  time: '2021-10-31T09:41:27.981Z',
  timestamp: 1635586887981,
  name: 'my-app-package-name',
  version: '1.0.0',
  ip: '::1',
  method: 'GET',
  url: '/v1/users'
}

/* request processing... */

response
{
  time: '2021-10-31T09:41:28.556Z',
  timestamp: 1635586888556,
  name: 'my-app-package-name',
  version: '1.0.0',
  ip: '::1',
  method: 'GET',
  url: '/v1/users',
  status: 200,
  response_size: '105b',
  response_time: '577ms'
}
```

### Log with custom fields

```javascript
import koa from 'koa';
import logger from 'koa-pretty-log';

const app = new koa()

// log with the additional fields "customer" and "auth_key"
app.use(
  logger({
    addFields: (ctx) => ({
      customer: 'my-customer',
      auth_key: ctx.request.headers['x-auth_key'] 
    })
  })
);
```

### Exclude log
```javascript
import koa from 'koa';
import logger from 'koa-pretty-log';

const app = new koa()

// exlude healtcheck log
app.use(
    logger({
      exclude: (ctx) => ctx.path.includes('healthcheck'),
    })
  );
```

## Options
- `logger`: function to log info with, default is `console.log`
- `addFields`: function receiving `ctx` as argument and returning additional properties to log
- `exclude`: function receiving `ctx` as argument and returning `bool` indicating whether to not log request
