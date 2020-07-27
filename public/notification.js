$(()=> {
    var socket = io();
    socket.on('notification', (note)=>{
        console.log(note);
        showNotification(note);
    })

    function showNotification (note) {
        var popup = document.getElementById("myPopup");
        popup.innerHTML = note;
        popup.classList.toggle("show");
    }
});