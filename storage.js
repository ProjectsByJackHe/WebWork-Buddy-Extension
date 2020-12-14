const saveButton = document.getElementById("save") 
const cache = document.getElementById("cache")
const clearAll = document.getElementById("clear-all")

clearAll.onclick = () => {
    // clear every expression 
    localStorage.setItem("latex", "") 
    localStorage.setItem("expression", "") 
    renderSavedExpressions()
}

function renderSavedExpressions() {
    const cachedLatex = localStorage.getItem("latex")
    const cachedExpressions = localStorage.getItem("expression")

    while (cache.firstChild) {
        cache.removeChild(cache.firstChild)
    }

    if (cachedLatex !== null && cachedExpressions !== null) {
    
        let latex = cachedLatex.split(" ") 
        let expressions = cachedExpressions.split(" ")
    
        latex.shift() 
        expressions.shift()
    
        function editLambda() {
           mathField.latex(latex[this.parentNode.id])
        }
    
        function copyLambda() {
             // Create new element
            var el = document.createElement('textarea');
            // Set value (string to be copied)
            let i = Number(this.parentNode.id) 
            el.value = expressions[i];
            // Set non-editable to avoid focus and move outside of view
            el.setAttribute('readonly', '');
            el.style = {position: 'absolute', left: '-9999px'};
            document.body.appendChild(el);
            // Select text inside element
            el.select();
            // Copy text to clipboard
            document.execCommand('copy');
            // Remove temporary element
            document.body.removeChild(el);
            this.innerHTML = "COPIED!"
            setTimeout(() => {
                this.innerHTML = "Copy"
            }, 500);
        }
    
        function delLambda() {
            // update data correctly
            let index = Number(this.parentNode.id)
            latex.splice(index, 1) 
            expressions.splice(index, 1) 
            let newLatex = "" 
            let newExpressions = "" 
            for (let i = 0; i < latex.length; i++) {
                newLatex += " " + latex[i]
                newExpressions += " " + expressions[i]
            }
            localStorage.setItem("latex", newLatex) 
            localStorage.setItem("expression", newExpressions)
            cache.removeChild(cache.childNodes[index])
            for (let i = 0; i < cache.childElementCount; i++) {
                cache.childNodes[i].id = i
            }
        }
    
        let i = 0 
        for (let member of latex) {
            // initialize <li> node and text node
            let node = document.createElement("LI")
            node.id = i
            node.style.display = "flex" 
            node.style.margin = "15px"
            let textNode = document.createTextNode("\\[" + member + "\\]")
            
            // create buttons
            let edit = document.createElement("BUTTON") 
            let copy = document.createElement("BUTTON") 
            let del = document.createElement("BUTTON")
            edit.style.marginLeft = "15px"
            edit.innerHTML = "Edit" 
            copy.innerHTML = "Copy"  
            del.innerHTML = "Delete"
            edit.onclick = editLambda 
            copy.onclick = copyLambda
            del.onclick = delLambda
    
            // add elements to be rendered on DOM
            node.appendChild(textNode) 
            node.appendChild(edit) 
            node.appendChild(copy) 
            node.appendChild(del)
            cache.appendChild(node)
            i++
        }
    }
}

saveButton.onclick = () => {
    saveCurrentExpression()
}   

function saveCurrentExpression() {
    updateSaved() 
    renderSavedExpressions()
    MathJax.typeset()
}

renderSavedExpressions()

const savePref = localStorage.getItem("save-on-clear")
if (savePref === null) {
    localStorage.setItem("save-on-clear", "1")
} else {
    if (savePref === "1") {
        document.getElementById("save-on-clear").checked = true
    } else {
        document.getElementById("save-on-clear").checked = false
    }
}

let saveOnClear = document.getElementById("save-on-clear")

saveOnClear.onclick = () => {
    if (!saveOnClear.checked) {
        localStorage.setItem("save-on-clear", "0")
    } else {
        localStorage.setItem("save-on-clear", "1")
    }
}