let outputText = document.getElementById('outputText');
let copy = document.getElementById('copy') 
let clear = document.getElementById('clear')
let userInput = document.getElementById('userInput') 

let latex = ""
let answer = ""
let webwork = ""

function updateSaved() {
    let currentlySavedLatex = localStorage.getItem("latex") || ""
    let currentlySavedExpressions = localStorage.getItem("expression") || ""

    if (latex !== "") {
        localStorage.setItem("latex", currentlySavedLatex + " " + latex) 
        localStorage.setItem("expression", currentlySavedExpressions + " " + answer)
    }
}

outputText.onfocus = (event) => {
    event.target.select()
}
outputText.onblur = (e) => {
    outputText.value = webwork
}

let mathFieldSpan = document.getElementById('math-field');
let MQ = MathQuill.getInterface(2);
let currentScrollPosition = 0

let mathField = MQ.MathField(mathFieldSpan, {
    autoCommands: 'pi theta sqrt sum rho phi',
    spaceBehavesLikeTab: true, 
    handlers: {
        edit: function() {
            latex = mathField.latex()
            chrome.storage.sync.set({key: latex}, function() {
                console.log('Latex is set to ' + latex);
            });
            answer = latexToWebWork(latex)
            webwork = answer
            outputText.value = answer
            
            if (window.innerWidth === 800) {
                currentScrollPosition = userInput.scrollLeft 
                if (mathField.__controller.cursor[1] === 0) {
                    snapToEnd(10 ** 9)
                } else {
                    adjustScrollBar()
                }
            }
        }
    }
});


function adjustScrollBar() {
    setTimeout(() => {
        userInput.scrollLeft = currentScrollPosition
    }, 3);
}

function snapToEnd(theEnd) {
    setTimeout(() => {
        userInput.scrollLeft = theEnd 
        mathSpanLength = userInput.scrollLeft
    }, 3)
}


chrome.storage.sync.get(['key'], function(result) {
    console.log('Value currently is ' + result.key);
    if (result.key === "" || result.key === undefined) {
        outputText.value = "Mac: Cmd+Shift+A, Windows: Ctrl+Shift+A"
    } else {
        mathField.latex(result.key)
    }
});

clear.onclick = () => {
    let saveOnClear = document.getElementById("save-on-clear") 
    if (saveOnClear.checked) {
        saveCurrentExpression()
    }
    mathField.latex("")
}

copy.onclick = () => {
    outputText.select()
    document.execCommand("copy")
    copy.innerHTML = "Copied!"
    copy.className = "btn btn-success"
    setTimeout(() => {
        copy.innerHTML = "Copy"
        copy.className = "btn btn-primary"
    }, 1000)
}


/**
 * @param {string} latex 
 * 
 * Latex ==> WebWork Expression
 * 
 * 1. Brackets
 * 2. Fractions
 * 3. remove all '\'
 * 
 */

function latexToWebWork(latex) {
    latex = Brackets.remove(latex)
    latex = Fractions.remove(latex)
    latex = finish(latex)
    return latex
}


/**
 * Finds every \left and \right
 * and removes them.
 */
let Brackets = {
    remove(latex) {
        let i = 0
        while (i < latex.length) {
            if (this.isLeftBracket(latex, i)) {
                latex = drop(latex, i, i+4)
            } else if (this.isRightBracket(latex, i)) {
                latex = drop(latex, i, i+5)
            }
            i++
        }
        return latex
    }, 
    isLeftBracket(l, s) {
        if (l[s] === '\\' && s + 4 < l.length) {
            return l[s + 1] === 'l' && l[s + 2] === 'e' && l[s + 3] === 'f' && l[s + 4] === 't'
        }
        return false
    }, 
    isRightBracket(l, s) {
        if (l[s] == '\\' && s + 5 < l.length) {
            return l[s + 1] === 'r' && l[s + 2] === 'i' && l[s + 3] === 'g' && l[s + 4] === 'h' && l[s + 5] === 't'
        }
        return false
    }
}



/**
 * Finds every \frac { ... } { ... } and returns { ... } / { ... }
 */
let Fractions = {
    remove(latex) {
        let i = 0 
        while (i < latex.length) {
            if (this.isFrac(latex, i)) {
                latex = drop(latex, i, i + 4) 
                let stack = []
                for (let j = i; j < latex.length; j++) {
                    if (latex[j] === '{') {
                        stack.push('{')
                    } else if (latex[j] === '}') {
                        if (stack.length < 1) {
                            alert('INVALID FRACTION')
                            return 'ERROR'
                        }
                        stack.pop()
                        if (stack.length === 0) {
                            latex = latex.substring(0, j + 1) + '/' + latex.substring(j + 1, latex.length)
                            break
                        }
                    }
                }
            }
            i++
        }
        return latex
    },
    isFrac(l, s) {
        if (l[s] === '\\' && s + 4 < l.length) {
            return l[s + 1] === 'f' && l[s + 2] === 'r' && l[s + 3] === 'a' && l[s + 4] === 'c'
        }
        return false
    }   
}



/**
 * removes all instances of '/',
 * Looks for all instances of cdot and replaces with '*'
 */
function finish(latex) {
    let output = ""
    for (let c of latex) {
        if (c !== '\\') {
            output += c
        }
    }
    return removeCDot(output)
}


function removeCDot(output) {
    let i = 0
    while (i < output.length) {
        if (isCDot(output, i)) {
            const left = output.substring(0, i) 
            const right = output.substring(i + 4, output.length) 
            output = left + "*" + right
        }
        i++
    }
    return output
}

function isCDot(l, s) {
    if (l[s] === 'c' && s + 3 < l.length) {
        return l[s + 1] === 'd' && l[s + 2] === 'o' && l[s + 3] === 't'
    }
    return false
}


/**
 * 
 * @param {string} latex 
 * @param {int} start 
 * @param {int} end 
 * 
 * returns a new string without the characters between start and end inclusive.
 * Start and end are both indices. 
 */
function drop(latex, start, end) {
    if (start > end || start < 0 || end > latex.length) {
        alert('INVALID USE OF DROP.')
        return 'ERROR'
    }
    return latex.substring(0, start) + latex.substring(end + 1, latex.length)
}

/**
 * ==============================================================================
 * ==============================================================================
 *  TESTS:
 * ==============================================================================
 * ==============================================================================
 */