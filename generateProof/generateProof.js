var fs = require('fs')
var path = require('path')
const BigNumber = require('bignumber.js')
BigNumber.config({ DECIMAL_PLACES: 10, ROUNDING_MODE: 4, EXPONENTIAL_AT: [-50, 50] })

const Web3 = require('web3')
const secp256k1 = require('secp256k1')
var web3 = new Web3();

var PRIVATE_SIGNER = ''
var EXTRA_REWARD = new BigNumber('20e18') // 20 BDP

function sign(msg, privateKey) {
  privateKey = Buffer.from(privateKey, 'hex')
  msg = Buffer.from(msg, 'hex')
  const sig = secp256k1.ecdsaSign(msg, privateKey)
  const ret = {}
  ret.r = sig.signature.slice(0, 32)
  ret.s = sig.signature.slice(32, 64)
  ret.v = sig.recid + 27
  return ret
}

var lines = fs.readFileSync(path.join(__dirname, './reward.csv'), 'utf8').trim().split('\n')
var sum = 0
var result = []
lines.forEach((e, i) => {
  var add = e.split(',')[0].toLowerCase()
  if (add == 'add') return;
  var amount = e.split(',')[1].toLowerCase()
  amount = new BigNumber(amount).plus(EXTRA_REWARD)
  var msg = web3.utils.soliditySha3(add, amount)
  var signature = sign(msg.slice(2), PRIVATE_SIGNER)

  result.push({
    address: add,
    amount: amount,
    proof: {
      v: signature.v,
      r: Array.from(signature.r),
      s: Array.from(signature.s)
    }
  })

  sum += amount.div(10 ** 18).toNumber()
})

fs.writeFileSync(path.join(__dirname, 'proof.json'), JSON.stringify(result, null, 2))

console.log(sum)
