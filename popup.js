var outputText = document.getElementById('outputText');
var copy = document.getElementById('copy') 
var clear = document.getElementById('clear')
var userInput = document.getElementById('userInput') 
var sqrt = document.getElementById('sqrt') 
var pie = document.getElementById('pi')
var clip = document.getElementById('clip')
var webwork = ""
outputText.onfocus = (event) => {
    event.target.select()
}
outputText.onblur = (e) => {
    outputText.value = webwork
}
var PARSED_FLAG = true; 
let SHOULD_CLIP = true;
var mathFieldSpan = document.getElementById('math-field');
var MQ = MathQuill.getInterface(2);
let currentScrollPosition = 0
var mathField = MQ.MathField(mathFieldSpan, {
    spaceBehavesLikeTab: true, 
    handlers: {
        edit: function() {
            latex = mathField.latex()
            chrome.storage.sync.set({key: latex}, function() {
                console.log('Latex is set to ' + latex);
            });
            if (PARSED_FLAG) {
                parseInput(latex)
            }
            answer = latexToWebWork(latex)
            webwork = answer
            outputText.value = answer
            
            if (window.innerWidth === 800) {
                currentScrollPosition = userInput.scrollLeft 
                if (mathField.__controller.cursor[1] === 0 && SHOULD_CLIP) {
                    snapToEnd(10 ** 9)
                } else {
                    adjustScrollBar()
                }
            }
        }
    }
});

clip.onclick = () => {
    if (SHOULD_CLIP) {
        SHOULD_CLIP = false
        clip.innerHTML = "Clipping Disabled" 
    } else {
        SHOULD_CLIP = true
        clip.innerHTML = "Clipping Enabled"
    }
}

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
        outputText.value = "MacOS: Command + E, Windows: Ctrl + E"
    } else {
        mathField.latex(result.key)
    }
});

clear.onclick = () => {
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

sqrt.onclick = () => {
    mathField.cmd('\\sqrt')
}

pie.onclick = () => {
    mathField.cmd('\\pi')
}

/**
 * @param {latex: string} input
 * Looks for 'sqrt' and 'pi' 
 * and replaces it with \\sqrt{} 
 * and \\pi
 */


function parseInput(input) {
    PARSED_FLAG = false
    let parsedInput = input
    parsedInput = squareRoot(parsedInput)
    parsedInput = pi(parsedInput)
    if (parsedInput !== input) {
        mathField.latex(parsedInput)
        mathField.focus()
    }
    PARSED_FLAG = true
}

function squareRoot(parsedInput) {
    let i = 0 
    while (i < parsedInput.length) {
        if (exist(parsedInput, i, "sqrt")) {
            // assume parsedInput[i] == "s", ...[i + 1] == "q" ... etc
            const left = parsedInput.substring(0, i) 
            const right = parsedInput.substring(i + 4, parsedInput.length)
            parsedInput = left + "\\sqrt{}" + right
            i += 3
        }
        i++
    }
    return parsedInput
}

function pi(parsedInput) {
    let i = 0
    while (i < parsedInput.length) {
        if (exist(parsedInput, i, "pi")) {
            // assume parsedInput[i] == "p", ...[i + 1] == "i"
            const left = parsedInput.substring(0, i) 
            const right = parsedInput.substring(i + 2, parsedInput.length)
            parsedInput = left + "\\pi" + right
            i++
        }
        i++
    }
    return parsedInput
}

function exist(parsedInput, s, text) {
    if (s - 1 >= 0 && parsedInput[s - 1] === "\\") {
        return false
    }
    if (s + text.length - 1 >= parsedInput.length) {
        return false
    }
    for (i = 0; i < text.length; i++) {
        if (text[i] != parsedInput[s + i]) {
            return false
        }
    }
    return true
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
var Brackets = {
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
var Fractions = {
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