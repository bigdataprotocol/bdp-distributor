const BigNumber = require('bignumber.js')
var abi = require('./balphamasterabi.js')
const Web3 = require('web3')
const web3 = new Web3('https://mainnet.infura.io/v3/')
BigNumber.config({ DECIMAL_PLACES: 10, ROUNDING_MODE: 4, EXPONENTIAL_AT: [-50, 50] })
let contract = new web3.eth.Contract(abi, '0x0de845955e2bf089012f682fe9bc81dd5f11b372')


function getReward(add) {
  var promise = []
  console.log(add)
  for (let id = 0; id < 12; id++) {
    promise.push(new Promise((resolve, reject) => {
      contract.methods.pendingReward(id, add).call({
        from: add,
      }, 12022028, (err, data) => {
        if (err) return reject(err)
        resolve([id, data])
      })
    }))
  }
  Promise.all(promise)
  .then(e => {
    console.log({
      address: add,
      reward: e,
      total: e.reduce((s, v) => s.plus(new BigNumber(v[1])), new BigNumber(0)).toString()
    })
  })
  .catch(ex => {
    cb && cb(ex)
  })
}

getReward('0x404142817ef474403578d495d0bf6d8b732927cb')