document.addEventListener('DOMContentLoaded', () => {
    function testFunction() {
        console.log("Original test function!");
    }
    
    let hook = "testFunction";
    try {
        let orig = eval(hook);
        let newFn = function() {
            console.log("New wrapped function!");
            orig();
        };
        eval(hook + " = newFn;");
    } catch(e) { console.error(e); }
    
    testFunction();
});
