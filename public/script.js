const socket = io();
let timmerevt;
let defalut_timeout = 10; // Default screen timeout 10s
let pageState = null;
let stackState = null;

/* Handle disconnect event */
socket.on("disconnect", () => {
    hideAll();
    document.getElementById("loadWin").style.display = "block";
});

/* Handle connect event */
socket.on("Connected", function (data) {
    if(data == 'Connected'){
        sendState('sec1');
        /* Check Web Storage support */
        if (typeof(Storage) !== "undefined") {
            clearVal();
            hideAll();
            document.getElementById("sec1").style.display = "block";
          } else {
            /* Show error in error page if web storage not support */
            hideAll();
            document.getElementById("errWin").style.display = "block";
            document.getElementById("error_msg").innerHTML = "Sorry! No Web Storage support..";
        }        
    };
});

/* Get cashcode device state */
socket.on('Status', sts => {
    /* Show index window */
    if(sts.status != null){
        document.getElementById("errWin").style.display = "none";
        document.getElementById("status").innerHTML = sts.status;
    }
    /* Get current state of windows */
    else if(sts.page != null ){
        pageState = sts.page;
    }
    /* Show error window */
    else if(sts.error != null && (pageState == 'sec1' || pageState == 'sec2' || (pageState == 'sec3' && stackState == null))){
        hideAll();
        bcktomain();
        document.getElementById("errWin").style.display = "block";
        document.getElementById("error_msg").innerHTML = sts.error;
    }

    /* Update inner html content */
    document.getElementById("amount").innerHTML = localStorage.getItem("Amount") || 0;
    document.getElementById("total").innerHTML = localStorage.getItem("Total") || 0;
    document.getElementById("refill").innerHTML = localStorage.getItem("Refill") || 0;
});

/* If stacked triggerd clear timout to redirect index window */
socket.on('stacked', ()=>{
    clearTimeout(timmerevt);
    stackState = 'stacked';
});

/* Store stacked amount */
socket.on('Amount', amt => {
    localStorage.setItem("Amount", amt);
});

/* Store total amount */
socket.on('Total', ttl => {
    localStorage.setItem("Total", ttl);
});

/* Store refill volume */
socket.on('Refill', refill => {
    localStorage.setItem("Refill", refill);
});

/* Genarete fake data */
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

/* Hide all windows */
function hideAll() {
    document.getElementById("loadWin").style.display = "none";
    document.getElementById("sec1").style.display = "none";
    document.getElementById("sec2").style.display = "none";
    document.getElementById("sec3").style.display = "none";
    document.getElementById("sec4").style.display = "none";
    document.getElementById("sec5").style.display = "none";
    document.getElementById("errWin").style.display = "none";
}

/* Redirect timer start */
function timmer(timeout, section){
    clearTimeout(timmerevt);
    timmerevt = setTimeout(() => {
        hideAll();
        sendState(section);
        document.getElementById(section).style.display = "block";
    }, timeout * 1000);
}

/* Send current page state */
function sendState(state){
    socket.emit('Page', state);
}

/* Clear values */
function clearVal(){
    /* Clear storage data */
    localStorage.clear();
    /* Clear variable data */
    document.getElementById('maxPayment').innerHTML = 0;
    document.getElementById("inputVol").value = '';
}

/* Back to main function */
function bcktomain(timeout = defalut_timeout){
    console.log('back to main');
    clearVal();
    timmer(timeout, 'sec1');
}

/* Sec1 confirm button event */
function cnfsec1(){
    bcktomain(30); // Set default timeout to 30s
    sendState('sec2');
    hideAll();
    document.getElementById("sec2").style.display = "block";
}

/* Sec2 confirm button event */
function cnfsec2(){
    let vol = (document.getElementById("inputVol").value);
    /* check enterd volume */
    if(vol < 10){
        bcktomain(30); // Set default timeout to 30s
        alert("Enter 10ml at least!")
    }
    else{
        bcktomain(30); // Set default timeout to 30s
        sendState('sec3');
        hideAll();
        document.getElementById("sec3").style.display = "block"; // Show sec3 window
        socket.emit('maxAmt', vol);

        /* Display max amount in sec3 */
        document.getElementById("max").innerHTML = vol;
    }
}

/* Sec3 confirm button event */
function cnfsec3(){
    /* Check cash enterd */
    if(stackState == 'stacked'){
        clearTimeout(timmerevt);
        hideAll();
        sendState('sec4');
        document.getElementById("sec4").style.display = "block"; // show sec4 window
        fackData().then(()=>{
            cnfsec4();
        });
    }
    else{
        bcktomain(30); // Set default timeout to 30s
        alert("Enter Cash to Proceed!");
    }
}

/* show sec5 window */
function cnfsec4(){
    bcktomain();
    hideAll();

    sendState('sec5');
    document.getElementById("sec5").style.display = "block";
    socket.emit('Done');
    stackState = null;
}

/* Calculate max price according to the bottle volume */
function calprice()
{
    var total = document.getElementById('inputVol').value;

    if(total >= 10){
        document.getElementById('maxPayment').innerHTML = total;
    }
    else{
        document.getElementById('maxPayment').innerHTML = 0;
    }
}