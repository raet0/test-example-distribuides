const assert = require('assert');

function runTest() {
  assert.strictEqual(1 + 1, 2, 'Math works');
  console.log('Tests passed!');
}

runTest();
