// Memory
var EmbeddingsRes = [];
var LexicalRes = [];
var EmbeddingsTime = [];
var EmbeddingsWordsNb = [];
var LexicalTime = [];
var LexicalWordsNb = [];
var CurrentEmTab = 0;
var CurrentLexTab = 0;

//hyperparameters
var emAgg = 0.1;
var emDanger = 3;
var lexAgg = 0.1;
var lexDanger = 3;

var colorList = ["lightcoral", "lightblue", "Linen", "DimGrey"];
var lightColorList = ["lightcoral", "lightblue"];

// reset memory and display with new game
function resetGame(){
    updateDisplayValue();
    EmbeddingsRes = [];
    LexicalRes = [];
    EmbeddingsTime = [];
    EmbeddingsWordsNb = [];
    LexicalTime = [];
    LexicalWordsNb = [];
    CurrentEmTab = 0;
    CurrentLexTab = 0;
    var emAnnonce = document.getElementsByClassName("Annonce");
    for (var i = 0; i < emAnnonce.length; i++){
        emAnnonce[i].innerHTML = "Utiliser les boutons ci-dessus pour demander un indice à l'IA.";
    }
    var btnsSpoil = document.getElementsByClassName('buttonAnnonce');
    for (var i = 0; i < btnsSpoil.length; i++){
        btnsSpoil[i].style.display = 'none';
        btnsSpoil[i].value = "Spoil";
    }
    var emZone = document.getElementById("EmbeddingsZone");
    var lexZone = document.getElementById("LexicalZone");
    emZone.style.backgroundColor = 'white';
    lexZone.style.backgroundColor = 'white';

    var reset = document.getElementsByClassName("reset");
    for (var i = 0; i < emAnnonce.length; i++){
        reset[i].innerHTML = '';
    }

    var details = document.getElementsByClassName("details");
    for (var i = 0; i < details.length; i++){
        details[i].style.display = 'none';
    }

    var navBtn = document.getElementsByClassName("navBtn");
    for (var i = 0; i < navBtn.length; i++){
        navBtn[i].style.display = 'none';
    }
}

function spoil(ai){
    var btn = 0;
    var detailsZone = document.getElementsByClassName("details");

    if (ai == 0){
        var btn = document.getElementById('spoilEm');
        detailsZone = detailsZone[0];
    } else if (ai == 1){
        var btn = document.getElementById('spoilLex');
        detailsZone = detailsZone[1];
    } else{
        alert("Error"); return;
    }

    if (btn.value == 'Spoil'){
        detailsZone.style.display = 'block';
        btn.value = 'Hide';

    } else if (btn.value == 'Hide'){
        detailsZone.style.display = 'none';
        btn.value = 'Spoil';
    }
}

function nav(ai, dir){
    // alert(ai);
    var res = [];
    var CurrentTab = 0;
    if (ai == 1){
        res = EmbeddingsRes;
        CurrentTab = CurrentEmTab;
    }
    else if (ai == 2){
        res = LexicalRes; 
        CurrentTab = CurrentLexTab;
    } 
    if ((CurrentTab + dir) < res.length){
        var index = CurrentTab + dir;
        var color = res[index][1];
        var result = res[index][0];
        populateResult(color, result, ai.toString(), save = false);
        if (ai == 1){
            CurrentEmTab = index;
        }
        else if (ai == 2){
            CurrentLexTab = index;
        } 
    }
}

// ---------- AI communication

// send distribution to AI, get response
function callAI(color, ai){
    //disable buttons to avoid communication error
    var btnToDisable = document.getElementsByClassName('btnToDisable');
    for (var i = 0; i < btnToDisable.length; i++){
        btnToDisable[i].disabled = true;
    }
    ai = parseInt(ai);
    agg = 0;
    danger = 0;
    if( ai == 1){ agg = emAgg; danger = emDanger;}
    else if (ai = 2){ agg = lexAgg; danger = lexDanger;}
    
    if (gameEnded){
        alert("La partie est terminée"); return;
    }
    fetch('/ai3', {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
            distribution, color, ai, agg, danger
        })
    }).then(function (response) {
        return response.text();

    // result
    }).then(function (jsonRes) {
        result = JSON.parse(jsonRes);
        populateResult(color, result, ai);
    });

}

// Populate results zone
function populateResult(color, result, ai, save = true){
    // memory save
    if (save){memorySave(result, ai, color);}
    var ai = parseInt(ai);

    // variables
    var colorName = "rouge";
    if (color == 1) colorName = "bleu";
    var resultsZone = document.getElementById("EmbeddingsZone");
    var annonce = document.getElementById("EmbeddingsAnnonce");
    var ol = document.getElementById("olEmbeddings");
    var olInfo = document.getElementById("olInfoEmbeddings")

    if (ai == 2){
        resultsZone = document.getElementById("LexicalZone");
        var annonce = document.getElementById("LexicalAnnonce");
        var ol = document.getElementById("olLexical");
        var olInfo = document.getElementById("olInfoLexical")
    }

    resultsZone.style.backgroundColor = lightColorList[color];

    var time = result[1];
    var res = result[0][0][0];
    annonce.innerHTML = "Indice "+colorName+" en " + time+"s : "+ res.bold() +" - "
        +result[0][0][2].length + " mot(s)";

    ol.innerHTML = "";
    var score = 0;
    for(var i = 0; i < result[0].length; i++){
        if(i >= 5) break;
        score = Number(result[0][i][1].toFixed(4));
        txt = (result[0][i][0]).bold() + " : [ " + result[0][i][2] + " ] | Score : " + score;
        const li = document.createElement("li");
        li.style.backgroundColor = lightColorList[color];
        li.innerHTML = txt;
        ol.appendChild(li);
    }
    
    olInfo.innerHTML = "";
    const li = document.createElement("li");
    var txt = "Temps moyen de calcul : " +(getMean(ai, 'time')).toString().bold() + "s";
    li.innerHTML = txt;
    olInfo.appendChild(li);
    var txt = "Nombre moyen de mots liés à l'indice : " + (getMean(ai, 'wordCount')).toString().bold();
    const li2 = document.createElement("li");
    li2.innerHTML = txt;
    olInfo.appendChild(li2);

    // display spoil buttons
    var btnsSpoil = document.getElementsByClassName('buttonAnnonce');
    btnsSpoil[ai - 1].style.display = 'block';

    var navBtn = document.getElementsByClassName("navBtn");
    if (ai == 1) var navBtn = document.getElementsByClassName("emNav");
    else if (ai == 2) var navBtn = document.getElementsByClassName("lexNav");
    for (var i = 0; i < navBtn.length; i++){
        navBtn[i].style.display = 'block';
    }

    // enable buttons 
    var btnToDisable = document.getElementsByClassName('btnToDisable');
    for (var i = 0; i < btnToDisable.length; i++){
        btnToDisable[i].disabled = false;
    }
}

//save info to be reused
function memorySave(result, ai, color){
    var newTime = parseFloat(result[1]);
    var wordNb = parseFloat(result[0][0][2].length);
    if (ai == 1){
        EmbeddingsRes.push([result, color]);
        EmbeddingsTime.push((newTime));
        EmbeddingsWordsNb.push((wordNb));
        CurrentEmTab = EmbeddingsTime.length - 1;
        return;
    }
    else if (ai == 2){
        LexicalRes.push([result, color]);
        LexicalTime.push((newTime));
        LexicalWordsNb.push((wordNb));
        CurrentLexTab = LexicalTime.length - 1;
    } return;
}

// info : time, wordCount
function getMean(ai, info){
    var tamp = 0;
    var d = 0;
    var res = 0;
    var list = [];

    if (ai == 1){
        switch(info){
            case 'time': 
                list = EmbeddingsTime;
                break;
            case 'wordCount':
                list = EmbeddingsWordsNb;
                break;
        }
    } else if (ai == 2){
        switch(info){
            case 'time': 
                list = LexicalTime;
                break;
            case 'wordCount':
                list = LexicalWordsNb;
                break;
        }
    }
    d = list.length;
    for (var i = 0; i < d; i += 1){
        tamp += list[i];
    }
    res = tamp/d;
    return Number(res.toFixed(2));
}

// update hyperparameters
function updateParams(){
    emAgg = document.getElementById("emAgg").value;
    emDanger = document.getElementById("emDanger").value;
    lexAgg = document.getElementById("lexAgg").value;
    lexDanger = document.getElementById("lexDanger").value;
}

function resetParams(){
    emAgg = 0.1;
    emDanger = 3;
    lexAgg = 0.1;
    lexDanger = 3;
    updateDisplayValue();
}

function updateDisplayValue(){
    var newEmAgg = document.getElementById("emAgg");
    var newEmDanger = document.getElementById("emDanger");
    var newLexAgg = document.getElementById("lexAgg");
    var newLexDanger = document.getElementById("lexDanger");
    newEmAgg.value = emAgg;
    newEmDanger.value = emDanger;
    newLexAgg.value = lexAgg;
    newLexDanger.value = lexDanger;
}
