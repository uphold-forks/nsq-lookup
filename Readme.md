
# @uphold/nsq-lookup

Lookup nsqd nodes via N nsqlookupd addresses.

## Installation

```
$ npm install @uphold/nsq-lookup
```

## Example

```js
const lookup = require('@uphold/nsq-lookup');

const addresses = [
	'http://0.0.0.0:4161',
	'http://0.0.0.0:4162',
	'http://0.0.0.0:4161',
];

const options = {
  timeout: 10000,
  topic: 'foobar'
};

lookup(addresses, options, function(errors, nodes) {
  if (errors) {
  	console.error(errors);
  }

  console.log(nodes);
});
```

# License

MIT
