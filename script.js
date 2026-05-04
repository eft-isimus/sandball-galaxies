window.addEventListener("scroll", function () {
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollFraction = scrollTop / docHeight;

    const line = document.getElementById("line");

    const margin = 20; // same as CSS margin
    const maxHeight = window.innerHeight - 2 * margin;

    line.style.height = (scrollFraction * maxHeight) + "px";
});
