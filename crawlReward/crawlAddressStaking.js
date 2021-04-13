const Web3 = require('web3')
const BigNumber = require('bignumber.js')
const web3 = new Web3('https://mainnet.infura.io/v3/')
var fs = require('fs')
var path = require('path')
var abi = require('./balphamasterabi.js')

let contract = new web3.eth.Contract(abi, '0x0de845955e2bf089012f682fe9bc81dd5f11b372')
async function crawlAllEvent() {
  var fromBlock = 12004568
  while(true) {
    console.log(fromBlock)
    var result = await contract.getPastEvents('allEvents', { fromBlock: fromBlock, toBlock: fromBlock + 50 })
    for (var i = 0; i < result.length; i++) {
      var e = result[i]
      console.log(`${e.blockNumber},${e.logIndex},${e.id},${e.event},${e.returnValues.user},${e.returnValues.pid},${e.returnValues.amount}`)
      fs.appendFileSync(path.join(__dirname,'./events.txt'), `${e.blockNumber},${e.logIndex},${e.id},${e.event},${e.returnValues.user},${e.returnValues.pid},${e.returnValues.amount}\n`)
    }
    fromBlock += 50;
  }
}


crawlAllEvent()