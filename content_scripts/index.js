'use strict';

const INPUT_CLASS = ".codeshard";
var MQ = MathQuill.getInterface(2);

function isWebwork() {
    return window.location.href.includes('webwork');
}

function initMathQuillElement(element) {
    let mathField = MQ.MathField(element, {
        spaceBehavesLikeTab: true, 
        autoCommands: 'pi theta sqrt sum',
        handlers: {
            edit: function() {
                let latex = mathField.latex();

                let answer = latexToWebWork(latex)

                console.log(latex,answer)
                
                // the next element, which is the webwork input, gets the generated latex
                $(element).next().val(answer)
            }
        }
    });

    // set the default value to whatever's in webwork's input
    mathField.typedText($(element).next().val());
}

function injectJacksNiceInput() {
    // add the math field to the beginning of every webwork's default input
    $(INPUT_CLASS).before('<span class="math-field"></span>');
    $('.math-field').each((index, element) => {
        initMathQuillElement(element)
    })
}

function main() {
    if (isWebwork()) {
        injectJacksNiceInput();
    }
}

window.addEventListener ("load", main, false);