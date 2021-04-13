var fs = require('fs')
var path = require('path')
const BigNumber = require('bignumber.js')
BigNumber.config({ DECIMAL_PLACES: 10, ROUNDING_MODE: 4, EXPONENTIAL_AT: [-50, 50] })
var lines = fs.readFileSync(path.join(__dirname, './reward.csv'), 'utf8').trim().split('\n')
var sum = 0
lines.forEach((e, i) => {
  var add = e.split(',')[0].toLowerCase()
  if (add == 'add') return;
  var amount = e.split(',')[1].toLowerCase()
  amount = (new BigNumber(amount).div(10 ** 18)).toNumber()
  if (amount >= 100) {
    fs.appendFileSync(path.join(__dirname, './multisend.csv'), `${add},${amount}\n`)
    fs.appendFileSync(path.join(__dirname, './contract-airdrop-add.csv'), `"${add}",`)
    fs.appendFileSync(path.join(__dirname, './contract-airdrop-amount.csv'), `${Math.round(amount)},`)
  }
  sum += amount
})

console.log(sum)
