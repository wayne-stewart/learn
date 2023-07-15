
(()=>{
    let el_date = document.querySelector("#date_target");

    let update_date = () => {
        let dt = new Date();
        el_date.innerHTML = dt.toDateString() + " " + dt.toTimeString();
        requestAnimationFrame(update_date);
    };

    update_date();
})();
