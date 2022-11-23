const socket = io();
let timmerevt;
let defalut_timeout = 10; // Default screen timeout 10s

socket.on("disconnect", () => {
    console.log('disconnect');
    hideAll();
    document.getElementById("loadWin").style.display = "block";
});

socket.on("Connected", function (data) {
    if(data == 'Connected'){
        localStorage.clear();
        console.log('connected');
        hideAll();
        document.getElementById("sec1").style.display = "block";          
    };
});

socket.on('Status', sts => {
    console.log('Status: ', sts)
    if(sts.status != null){
        document.getElementById("errWin").style.display = "none";
        document.getElementById("status").innerHTML = sts.status;
    }
    else{
        hideAll();
        bcktomain();
        document.getElementById("errWin").style.display = "block";
        document.getElementById("error_msg").innerHTML = sts.error;
    }

    document.getElementById("amount").innerHTML = localStorage.getItem("Amount") || 0;
    document.getElementById("total").innerHTML = localStorage.getItem("Total") || 0;
    document.getElementById("refill").innerHTML = localStorage.getItem("Refill") || 0;
});

socket.on('Amount', amt => {
    console.log('Amount: ', amt)
    localStorage.setItem("Amount", amt);
});

socket.on('Total', ttl => {
    console.log('Total: ', ttl);
    localStorage.setItem("Total", ttl);
});

socket.on('Refill', refill => {
    console.log('Refill: ', refill)
    localStorage.setItem("Refill", refill);
});

async function fackData(){
    return new Promise((resolve,reject) => {
        let amt = 0;
        let fake_timmer;
        fake_timmer = setInterval(() => {
            amt += 1;
            document.getElementById("fillingAmt").innerHTML = amt;

            if(localStorage.getItem("Total") <=  amt){
                clearTimeout(fake_timmer);
                setTimeout(() => {
                    resolve();
                }, 3000);
            }
        }, 1000);
    });
};

/////////////////////////////////////////////////////////////////////////
// hideAll();
function hideAll() {
    console.log("hide all");
    document.getElementById("loadWin").style.display = "none";
    document.getElementById("sec1").style.display = "none";
    document.getElementById("sec2").style.display = "none";
    document.getElementById("sec3").style.display = "none";
    document.getElementById("sec4").style.display = "none";
    document.getElementById("sec5").style.display = "none";
    document.getElementById("errWin").style.display = "none";
}

function timmer(timeout, section){
    console.log('timmer start');
    clearTimeout(timmerevt);
    timmerevt = setTimeout(() => {
        hideAll();
        document.getElementById(section).style.display = "block";
    }, timeout * 1000);
}

function sendState(state){
    console.log("State:", state);
}

function bcktomain(){
    console.log('back to main');
    localStorage.clear();
    timmer(defalut_timeout, 'sec1');
}

function cnfsec1(){
    console.log('tap2start');
    bcktomain();
    sendState('sec2');
    hideAll();
    document.getElementById("sec2").style.display = "block";
}

function cnfsec2(){
    console.log('bottle volume confirm');
    let vol = (document.getElementById("inputVol").value);

    // // localStorage.setItem("InputVol", document.getElementById("inputVol").value);
    // // let vol = localStorage.getItem("InputVol");

    if(vol < 10){
        bcktomain();
        alert("Enter 10ml at least!")
    }
    else{
        clearTimeout(timmerevt);
        sendState('sec3');
        hideAll();
        document.getElementById("sec3").style.display = "block";
        socket.emit('maxAmt', vol);

        /* Display max amount in sec2 */
        document.getElementById("max").innerHTML = vol;
    }
}

function cnfsec3(){
    if(localStorage.getItem("Total") >= 10){
        clearTimeout(timmerevt);
        hideAll();
        sendState('sec4');
        document.getElementById("sec4").style.display = "block";
        fackData().then(()=>{
            cnfsec4();
        });
    }
    else{
        alert("Enter Cash to Proceed!")
    }
}

function cnfsec4(){
    bcktomain();
    hideAll();
    localStorage.clear();

    /* Clear variable data */
    document.getElementById('maxPayment').innerHTML = 0;
    document.getElementById("inputVol").value = '';

    sendState('sec5');
    document.getElementById("sec5").style.display = "block";
    socket.emit('Done');
}

/* Calculate max price according to the bottle volume */
function calprice()
{
    var total = document.getElementById('inputVol').value;
    // var total = localStorage.getItem("InputVol");
    if(total >= 10){
        document.getElementById('maxPayment').innerHTML = total;
    }
    else{
        document.getElementById('maxPayment').innerHTML = 0;
    }
}

if (typeof(Storage) !== "undefined") {
    console.log("Code for localStorage/sessionStorage");
  } else {
    console.log("Sorry! No Web Storage support..");
}