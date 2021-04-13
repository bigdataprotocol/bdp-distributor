var fs = require('fs')
var path = require('path')
const BigNumber = require('bignumber.js')
BigNumber.config({ DECIMAL_PLACES: 10, ROUNDING_MODE: 4, EXPONENTIAL_AT: [-50, 50] })
var lines = fs.readFileSync(path.join(__dirname, './reward.csv'), 'utf8').trim().split('\n')
var sum = new BigNumber(0)
lines.forEach((e, i) => {
  var add = e.split(',')[0].toLowerCase()
  var amount = e.split(',')[1].toLowerCase()
  if (add == 'add') return;
  sum = sum.plus(new BigNumber(amount))
})

console.log(sum.toString())
