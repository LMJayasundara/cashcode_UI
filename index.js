var express = require('express');
var app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
app.set('port', (process.env.PORT || 8080));
let total = 0;
let maxAmtx = 0;
let pageState = null;

app.use(express.static('public'));

const BillValidator = require('cashcode-nodejs');
const device = new BillValidator({
  baudRate: 19200,
  autoPort: true,
  boardKeywordIdentifier: 'FTDI'
  // path: "COM3"
});

function getTotal(cash) {
  total = total + cash;
  return total;
}

function reset(){
  total = 0;
}

(async function () {
  await device.connect();

  io.on('connection', async (socket) => {

    // device.on('status', (sts)=>{
    //   socket.emit('Status', sts);
    // });

    socket.emit("Connected", "Connected");
    socket.on('maxAmt', (maxAmt)=>{
      maxAmtx = maxAmt;
      console.log("maxAmt:", maxAmtx);
    });

    socket.on('Done', ()=>{
      reset();
    });

    socket.on('Page', (page)=>{
      pageState = page;
      socket.emit('Status', {
        "page": page
      });
    });

  });

  device.on('error', (error) => {
    io.emit('Status', {
      "error": error
    });
  });

  device.on('powerup', function () {
    io.emit('Status', {
      "status": 'Device power up'
    });
  });

  device.on('reset', function () {
    io.emit('Status', {
      "status": 'Device reset'
    });
  });

  device.on('initialize', () => {
    io.emit('Status', {
      "status": "Device initialize"
    });
  });

  device.on("idling", () => {
    io.emit('Status', {
      "status": "Device on idle state"
    });
  });

  device.on('cassetteRemoved', () => {
    reset();
    io.emit('Status', {
      "error": "Cassette removed"
    });
  });

  device.on('cassetteFull', () => {
    io.emit('Status', {
      "error": "Cassette full"
    });
  });

  device.on('hold', () => {
    io.emit('Status', {
      "error": "Device on hold"
    });
  });

  device.on('returned', (cash) => {
    console.log("Returned", cash.amount);
  });

  device.on('accepting', async() => {
    console.log('accepting');
  });

  device.on('escrow', async (cash) => {
    total = getTotal(cash.amount);
    try {
      if (total > maxAmtx || pageState == 'sec1' || pageState == 'sec2' || pageState == 'sec4' || pageState == 'sec5' ) {
        total = total - cash.amount;
        await device.retrieve();
      }
      else {
        await device.stack();
        
        /* Emit current total amount */
        io.emit('Total', total);
        /* Emit available refill voulume */
        io.emit('Refill', total);
        /* Emit stacked amount */
        io.emit('Amount', cash.amount);
      }
    } catch (error) {
      io.emit('Status', {
        "error": error.message
      });
    }
  });

  device.on('stacked', (cash) => {
    io.emit('stacked');
    try {
      io.emit('Status', {
        "status": `Stacked ${cash.amount} Rs`
      });
    } catch (error) {
      io.emit('Status', {
        "error": error.message
      });
    }
  });

})();


server.listen(app.get('port'), function (err) {
  if (err) {
    console.log("Server error: ", err.message);
  } else {
    console.log('Running on port: ' + app.get('port'));
  }
});