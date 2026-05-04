window.addEventListener("scroll", function () {
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollFraction = scrollTop / docHeight;

    const maxHeight = window.innerHeight;
    const line = document.getElementById("line");

    line.style.height = (scrollFraction * maxHeight) + "px";
});
